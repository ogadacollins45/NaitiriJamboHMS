<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
use App\Models\PharmacyOrder;

class PrescriptionController extends Controller
{
    /**
     * List prescriptions
     */
    public function index()
    {
        $prescriptions = Prescription::with([
            'items.inventoryItem',
            'patient', 
            'treatment',
            'doctor'
        ])
        ->orderByDesc('created_at')
        ->get();

        // Transform each prescription
        return response()->json($prescriptions->map(function ($prescription) {
            return [
                'id' => $prescription->id,
                'patient_id' => $prescription->patient_id,
                'treatment_id' => $prescription->treatment_id,
                'doctor_id' => $prescription->doctor_id,
                'total_amount' => $prescription->total_amount,
                'status' => $prescription->status,
                'notes' => $prescription->notes,
                'created_at' => $prescription->created_at,
                'updated_at' => $prescription->updated_at,
                'patient' => $prescription->patient,
                'treatment' => $prescription->treatment,
                'doctor' => $prescription->doctor,
                'pharmacy_status' => $prescription->pharmacy_status, // Added for status logic
                'items' => $prescription->items->map(function ($item) {
                    $invItem = $item->inventoryItem;
                    return [
                        'id' => $item->id,
                        'name' => $item->drug_name_text ?? ($invItem ? $invItem->name : 'Unknown Item'),
                        'quantity' => $item->quantity,
                        'unit' => $invItem ? $invItem->unit : null,
                        'unit_price' => (float) $item->unit_price,
                        'subtotal' => (float) $item->subtotal,
                        'category' => $invItem ? $invItem->category : null,
                        'subcategory' => $invItem ? $invItem->subcategory : null,
                        'item_code' => $invItem ? $invItem->item_code : null,
                        'batch_no' => $invItem ? $invItem->batch_no : null,
                        'expiry_date' => $invItem && $invItem->expiry_date ? $invItem->expiry_date->format('Y-m-d') : null,
                        'dosage' => $item->dosage_text,
                        'frequency' => $item->frequency_text,
                        'duration' => $item->duration_text,
                        'instructions' => $item->instructions_text,
                        // Auto-mapping fields
                        'mapped_drug_id' => $item->mapped_drug_id,
                        'mapped_quantity' => $item->mapped_quantity,
                        'dispensed_from_stock' => $item->dispensed_from_stock,
                    ];
                })
            ];
        }));
    }

    /**
     * Show single prescription
     */
    public function show($id)
    {
        $prescription = Prescription::with([
            'items.inventoryItem',
            'patient', 
            'treatment',
            'doctor'
        ])->find($id);

        if (!$prescription) {
            return response()->json(['message' => 'Prescription not found'], 404);
        }

        return response()->json([
            'id' => $prescription->id,
            'patient_id' => $prescription->patient_id,
            'treatment_id' => $prescription->treatment_id,
            'doctor_id' => $prescription->doctor_id,
            'total_amount' => $prescription->total_amount,
            'status' => $prescription->status,
            'notes' => $prescription->notes,
            'created_at' => $prescription->created_at,
            'updated_at' => $prescription->updated_at,
            'patient' => $prescription->patient,
            'treatment' => $prescription->treatment,
            'doctor' => $prescription->doctor,
            'items' => $prescription->items->map(function ($item) {
                $invItem = $item->inventoryItem;
                return [
                    'id' => $item->id,
                    'name' => $item->drug_name_text ?? ($invItem ? $invItem->name : 'Unknown Item'),
                    'quantity' => $item->quantity,
                    'unit' => $invItem ? $invItem->unit : null,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                    'category' => $invItem ? $invItem->category : null,
                    'subcategory' => $invItem ? $invItem->subcategory : null,
                    'item_code' => $invItem ? $invItem->item_code : null,
                    'batch_no' => $invItem ? $invItem->batch_no : null,
                    'expiry_date' => $invItem && $invItem->expiry_date ? $invItem->expiry_date->format('Y-m-d') : null,
                    'dosage' => $item->dosage_text,
                    'frequency' => $item->frequency_text,
                    'duration' => $item->duration_text,
                    'instructions' => $item->instructions_text,
                ];
            })
        ]);
    }

    /**
     * Store prescription + items, deduct stock, and refresh billing
     */
    public function store(Request $request)
    {
        // 🔧 In case "items" arrives as a JSON string, force-decode it.
        if (is_string($request->input('items'))) {
            $request->merge(['items' => json_decode($request->input('items'), true)]);
        }

        $validated = $request->validate([
            'patient_id'           => 'required|exists:patients,id',
            'treatment_id'         => 'required|exists:treatments,id',
            'doctor_id'            => 'nullable|exists:doctors,id',
            'send_to_pharmacy'     => 'nullable|boolean',
            'items'                => 'required|array|min:1',
            'items.*.name'         => 'required|string|max:255',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.unit_price'   => 'nullable|numeric|min:0',
            // New text-based fields for pharmacy workflow
            'items.*.dosage'       => 'nullable|string|max:100',
            'items.*.frequency'    => 'nullable|string|max:100',
            'items.*.duration'     => 'nullable|string|max:100',
            'items.*.instructions' => 'nullable|string',
            'items.*.drug_id'      => 'nullable|exists:pharmacy_drugs,id', // For auto-mapping
            'notes'                => 'nullable|string',
        ]);

        try {
            $prescription = DB::transaction(function () use ($validated) {
                $sendToPharmacy = $validated['send_to_pharmacy'] ?? false;
                
                $prescription = Prescription::create([
                    'patient_id'   => $validated['patient_id'],
                    'treatment_id' => $validated['treatment_id'],
                    'doctor_id'    => $validated['doctor_id'] ?? null,
                    'total_amount' => 0,
                    'notes'        => $validated['notes'] ?? null,
                    'pharmacy_status' => $sendToPharmacy ? 'sent_to_pharmacy' : 'draft',
                    'sent_to_pharmacy_at' => $sendToPharmacy ? now() : null,
                ]);

                $total = 0;

                foreach ($validated['items'] as $row) {
                    $name       = $row['name'];
                    $qty        = (int) $row['quantity'];
                    $unit       = isset($row['unit_price']) ? (float) $row['unit_price'] : 0;
                    $line       = $qty * $unit;

                    // Try match inventory item by name
                    $inv = InventoryItem::where('name', $name)->first();
                    
                    // Auto-mapping: if drug_id is provided, set mapped_drug_id
                    $mappedDrugId = null;
                    $mappedQuantity = null;
                    if (isset($row['drug_id']) && $row['drug_id']) {
                        $mappedDrugId = $row['drug_id'];
                        $mappedQuantity = $qty; // Default to same quantity
                    }

                    // Create prescription item with text fields
                    PrescriptionItem::create([
                        'prescription_id'  => $prescription->id,
                        'inventory_item_id'=> $inv ? $inv->id : null,
                        'quantity'         => $qty,
                        'unit_price'       => $unit,
                        'subtotal'         => $line,
                        // Text-based fields for pharmacy
                        'drug_name_text'   => $name,
                        'dosage_text'      => $row['dosage'] ?? null,
                        'frequency_text'   => $row['frequency'] ?? null,
                        'duration_text'    => $row['duration'] ?? null,
                        'instructions_text'=> $row['instructions'] ?? null,
                        // Auto-mapping fields
                        'mapped_drug_id'   => $mappedDrugId,
                        'mapped_quantity'  => $mappedQuantity,
                    ]);

                    $total += $line;
                }

                $prescription->update(['total_amount' => $total]);

                // Create pharmacy order automatically
                PharmacyOrder::create([
                    'prescription_id' => $prescription->id,
                    'patient_id'      => $prescription->patient_id,
                    'doctor_id'       => $prescription->doctor_id,
                    'status'          => 'pending',
                ]);

                return $prescription->load(['items.inventoryItem', 'doctor', 'patient']);
            });

            // Transform items for response
            $responseData = [
                'id' => $prescription->id,
                'patient_id' => $prescription->patient_id,
                'treatment_id' => $prescription->treatment_id,
                'doctor_id' => $prescription->doctor_id,
                'total_amount' => $prescription->total_amount,
                'status' => $prescription->status,
                'notes' => $prescription->notes,
                'created_at' => $prescription->created_at,
                'updated_at' => $prescription->updated_at,
                'patient' => $prescription->patient,
                'doctor' => $prescription->doctor,
                'items' => $prescription->items->map(function ($item) {
                    $invItem = $item->inventoryItem;
                    return [
                        'id' => $item->id,
                        'name' => $item->drug_name_text ?? ($invItem ? $invItem->name : 'Unknown Item'),
                        'quantity' => $item->quantity,
                        'unit' => $invItem ? $invItem->unit : null,
                        'unit_price' => (float) $item->unit_price,
                        'subtotal' => (float) $item->subtotal,
                        'category' => $invItem ? $invItem->category : null,
                        'subcategory' => $invItem ? $invItem->subcategory : null,
                        'item_code' => $invItem ? $invItem->item_code : null,
                        'batch_no' => $invItem ? $invItem->batch_no : null,
                        'expiry_date' => $invItem && $invItem->expiry_date ? $invItem->expiry_date->format('Y-m-d') : null,
                        'dosage' => $item->dosage_text,
                        'frequency' => $item->frequency_text,
                        'duration' => $item->duration_text,
                        'instructions' => $item->instructions_text,
                    ];
                })
            ];

            // 🔄 Refresh or generate the bill for this treatment
            try {
                app(\App\Http\Controllers\BillingController::class)
                    ->store(new Request([
                        'patient_id'   => $prescription->patient_id,
                        'treatment_id' => $prescription->treatment_id,
                        'doctor_id'    => $prescription->doctor_id ?? null,
                        'auto'         => true,
                    ]));
            } catch (\Throwable $e) {
                \Log::error('Auto billing update failed after prescription: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Prescription saved, stock updated, billing refreshed',
                'data'    => $responseData,
            ], 201);

        } catch (\Throwable $e) {
            \Log::error('Prescription save failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to save prescription',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete prescription
     */
    /**
     * Get deleted prescriptions for a patient
     */
    public function deletedPrescriptions($patientId)
    {
        $prescriptions = Prescription::onlyTrashed()
            ->with([
                'items' => function ($query) {
                    $query->withTrashed()->with('inventoryItem');
                },
                'doctor'
            ])
            ->where('patient_id', $patientId)
            ->orderByDesc('deleted_at')
            ->get();

        return response()->json($prescriptions->map(function ($prescription) {
            return [
                'id' => $prescription->id,
                'deleted_at' => $prescription->deleted_at,
                'created_at' => $prescription->created_at,
                'doctor_name' => $prescription->doctor ? "Dr. {$prescription->doctor->first_name} {$prescription->doctor->last_name}" : 'Unknown',
                'items_count' => $prescription->items->count(),
                'items' => $prescription->items->map(function ($item) {
                    return [
                        'name' => $item->drug_name_text ?? ($item->inventoryItem ? $item->inventoryItem->name : 'Unknown Item'),
                        'quantity' => $item->quantity,
                        'dosage' => $item->dosage_text,
                    ];
                })
            ];
        }));
    }

    /**
     * Delete prescription
     */
    public function destroy($id)
    {
        $prescription = Prescription::find($id);

        if (!$prescription) {
            return response()->json(['message' => 'Prescription not found'], 404);
        }

        // check if dispensed
        if ($prescription->pharmacy_status === 'dispensed') {
             return response()->json(['message' => 'Cannot delete a dispensed prescription.'], 403);
        }

        DB::transaction(function () use ($prescription) {
            // Remove from pharmacy queue
            PharmacyOrder::where('prescription_id', $prescription->id)->delete();

            // Soft delete items
            $prescription->items()->delete();

            // Soft delete prescription
            $prescription->delete();
        });

        return response()->json(['message' => 'Prescription deleted successfully']);
    }
}