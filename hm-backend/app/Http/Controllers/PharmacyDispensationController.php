<?php

namespace App\Http\Controllers;

use App\Models\PharmacyDispensation;
use App\Models\PharmacyPrescription;
use App\Models\PharmacyPrescriptionItem;
use App\Models\PharmacyDrugBatch;
use App\Models\PharmacyDispensationItem;
use App\Models\PharmacyInventoryTransaction;
use App\Models\PharmacyStockAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PharmacyDispensationController extends Controller
{
    /**
     * Get pending prescriptions for dispensation
     */
    public function pendingPrescriptions(Request $request)
    {
        // Query PharmacyOrder which links to Prescription (created by doctors)
        // NOT PharmacyPrescription (which is a separate unused system)
        $orders = PharmacyOrder::with([
            'prescription.patient',
            'prescription.doctor',
            'prescription.treatment',
            'prescription.items',
        ])
        ->where('status', 'pending')
        ->orderBy('created_at', 'desc')
        ->get();

        // Transform to match frontend expectation
        $formattedOrders = $orders->map(function ($order) {
            $prescription = $order->prescription;
            
            return [
                'id' => $prescription->id,
                'prescription_number' => 'RX-' . str_pad($prescription->id, 6, '0', STR_PAD_LEFT),
                'patient' => $prescription->patient,
                'doctor' => $prescription->doctor,
                'treatment' => $prescription->treatment,
                'priority' => 'routine', // Default priority
                'prescribing_date' => $prescription->created_at,
                'items' => $prescription->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'drug' => [
                            'generic_name' => $item->drug_name_text,
                        ],
                        'quantity_prescribed' => $item->quantity,
                        'quantity_remaining' => $item->quantity,
                        'dosage' => $item->dosage_text,
                        'frequency' => $item->frequency_text,
                        'duration_text' => $item->duration_text,
                        'status' => 'pending',
                    ];
                }),
            ];
        });

        return response()->json(['data' => $formattedOrders]);
    }

    /**
     * SIMPLIFIED Dispense - Works with regular Prescription table
     * Creates minimal dispensation to trigger billing
     */
    public function dispense(Request $request)
    {
        $validated = $request->validate([
            'prescription_id' => 'required|exists:prescriptions,id', // Regular prescriptions table!
            'assigned_pharmacist_id' => 'required|exists:staff,id',
            'items' => 'required|array|min:1',
            'items.*.prescription_item_id' => 'required',
            'items.*.quantity' => 'required|integer|min:1',
            'counseling_notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Get the regular Prescription (created by doctors)
            $prescription = \App\Models\Prescription::with('items', 'treatment')
                ->findOrFail($validated['prescription_id']);

            if (!$prescription->treatment_id) {
                throw new \Exception("Prescription has no associated treatment");
            }

            $dispensedBy = $request->user();

            // Create simple dispensation record
            // The prescription_id here refers to the regular Prescription table
            $dispensation = PharmacyDispensation::create([
                'dispensation_number' => 'DISP-' . now()->format('Ymd') . '-' . str_pad(PharmacyDispensation::count() + 1, 4, '0', STR_PAD_LEFT),
                'prescription_id' => $prescription->id, // Links to regular Prescription
                'patient_id' => $prescription->patient_id,
                'dispensation_type' => 'full',
                'dispensed_at' => now(),
                'dispensed_by_staff_id' => $dispensedBy->id,
                'assigned_pharmacist_id' => $validated['assigned_pharmacist_id'],
                'total_amount' => 0, // Will be calculated
                'counseling_notes' => $validated['counseling_notes'] ?? null,
                'payment_status' => 'unpaid',
            ]);

            $totalAmount = 0;

            // Create simple dispensation items
            foreach ($validated['items'] as $itemData) {
                $prescriptionItem = $prescription->items->where('id', $itemData['prescription_item_id'])->first();
                
                if (!$prescriptionItem) {
                    continue; // Skip if not found
                }

                $quantity = $itemData['quantity'];
                // Use a default price of 100 per item if unit_price is 0
                $unitPrice = $prescriptionItem->unit_price > 0 ? $prescriptionItem->unit_price : 100;
                $lineTotal = $quantity * $unitPrice;

                // Create dispensation item (simplified - no batch tracking)
                PharmacyDispensationItem::create([
                    'dispensation_id' => $dispensation->id,
                    'prescription_item_id' => $prescriptionItem->id,
                    'drug_id' => null, // No drug table reference needed
                    'batch_id' => null, // No batch tracking
                    'quantity_dispensed' => $quantity,
                    'unit_price' => $unitPrice,
                    'unit_cost' => $unitPrice * 0.6, // 40% margin
                    'line_total' => $lineTotal,
                    'profit_margin' => $lineTotal * 0.4,
                    'dosage_given' => $prescriptionItem->dosage_text,
                    'instructions_given' => $prescriptionItem->instructions_text,
                ]);

                $totalAmount += $lineTotal;
            }

            // Update dispensation total
            $dispensation->update(['total_amount' => $totalAmount]);

            // Update PharmacyOrder status
            \App\Models\PharmacyOrder::where('prescription_id', $prescription->id)
                ->update(['status' => 'dispensed', 'dispensed_at' => now()]);

            DB::commit();

            Log::info("Simplified dispensation created: #{$dispensation->id} for prescription #{$prescription->id}, treatment #{$prescription->treatment_id}");

            // The PharmacyDispensationObserver will now trigger and add to bill!

            return response()->json([
                'message' => 'Dispensation successful',
                'dispensation' => $dispensation->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Dispensation failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Dispensation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get dispensation history
     */
    public function index(Request $request)
    {
        $query = PharmacyDispensation::with([
            'prescription',
            'patient',
            'assignedPharmacist',
            'dispensedByStaff',
            'items.drug',
        ]);

        // Filter by pharmacist
        if ($request->has('pharmacist_id')) {
            $query->where('assigned_pharmacist_id', $request->pharmacist_id);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('dispensed_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('dispensed_at', '<=', $request->to_date);
        }

        // Filter by payment status
        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        $dispensations = $query->latest('dispensed_at')->paginate(20);

        return response()->json($dispensations);
    }

    /**
     * Get single dispensation details
     */
    public function show($id)
    {
        $dispensation = PharmacyDispensation::with([
            'prescription.items.drug',
            'patient',
            'assignedPharmacist',
            'dispensedByStaff',
            'verifiedByPharmacist',
            'items.drug',
            'items.batch',
            'items.prescriptionItem',
        ])->findOrFail($id);

        return response()->json($dispensation);
    }

    /**
     * Mark as collected by patient
     */
    public function markCollected(Request $request, $id)
    {
        $validated = $request->validate([
            'collected_by_name' => 'nullable|string',
            'collected_by_id_number' => 'nullable|string',
            'collected_by_relationship' => 'nullable|string',
            'collection_method' => 'required|in:in_person,delivery,proxy',
        ]);

        $dispensation = PharmacyDispensation::findOrFail($id);
        
        $dispensation->markAsCollected(
            $validated['collected_by_name'] ?? null,
            $validated['collected_by_id_number'] ?? null,
            $validated['collected_by_relationship'] ?? null
        );

        $dispensation->collection_method = $validated['collection_method'];
        $dispensation->save();

        return response()->json([
            'message' => 'Marked as collected',
            'dispensation' => $dispensation,
        ]);
    }
}
