<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\PharmacyDrug;
use App\Models\PharmacyDrugBatch;
use App\Models\PharmacyInventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyReviewController extends Controller
{
    /**
     * Get prescriptions pending pharmacy review
     */
    public function pendingPrescriptions()
    {
        $prescriptions = Prescription::with(['patient', 'doctor', 'treatment', 'items.mappedDrug'])
            ->where('pharmacy_status', 'sent_to_pharmacy')
            ->orderBy('sent_to_pharmacy_at', 'asc')
            ->get();

        return response()->json($prescriptions);
    }

    /**
     * Get single prescription details for review
     */
    public function showPrescription($id)
    {
        $prescription = Prescription::with(['patient', 'doctor', 'treatment', 'items.mappedDrug'])
            ->findOrFail($id);

        return response()->json($prescription);
    }

    /**
     * Update prescription item mapping (pharmacist maps to actual drug)
     */
    public function mapItem(Request $request, $itemId)
    {
        $validated = $request->validate([
            'mapped_drug_id' => 'required|exists:pharmacy_drugs,id',
            'mapped_quantity' => 'required|integer|min:1',
        ]);

        $item = PrescriptionItem::findOrFail($itemId);
        
        $item->update([
            'mapped_drug_id' => $validated['mapped_drug_id'],
            'mapped_quantity' => $validated['mapped_quantity'],
        ]);

        return response()->json([
            'message' => 'Item mapped successfully',
            'item' => $item->load('mappedDrug'),
        ]);
    }

    /**
     * Dispense prescription immediately - deduct stock and mark as dispensed
     */
    public function dispenseNow(Request $request, $id)
    {
        $validated = $request->validate([
            'pharmacist_notes' => 'nullable|string',
        ]);

        $prescription = Prescription::with(['items.mappedDrug'])->findOrFail($id);

        // No longer require all items to be mapped - allow dispensing with some items not in stock

        DB::beginTransaction();
        try {
            // Deduct stock from pharmacy_drugs FOR MAPPED ITEMS ONLY
            foreach ($prescription->items as $item) {
                if (!$item->mapped_drug_id) {
                    // Mark as not dispensed from stock
                    $item->update([
                        'dispensed_from_stock' => false,
                    ]);
                    continue; // Skip stock deduction for unmapped items
                }
                
                $drug = PharmacyDrug::findOrFail($item->mapped_drug_id);
                
                // Check if enough stock
                if ($drug->current_stock < $item->mapped_quantity) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Insufficient stock for {$drug->generic_name}. Available: {$drug->current_stock}, Required: {$item->mapped_quantity}"
                    ], 400);
                }

                // 💰 UPDATE PRESCRIPTION ITEM WITH ACTUAL PRICE FOR BILLING
                $actualPrice = (float) $drug->default_unit_price;
                $actualQuantity = (int) $item->mapped_quantity;
                $actualSubtotal = $actualPrice * $actualQuantity;
                
                $item->update([
                    'unit_price' => $actualPrice,
                    'subtotal' => $actualSubtotal,
                ]);

                // Deduct stock
                $balanceBefore = $drug->current_stock;
                $drug->current_stock -= $item->mapped_quantity;
                $drug->save();

                // Get or create a batch for this drug (simplified approach - use first active batch or create one)
                $batch = $drug->batches()->where('status', 'active')->first();
                if (!$batch) {
                    // Create a simple batch if none exists
                    $batch = PharmacyDrugBatch::create([
                        'drug_id' => $drug->id,
                        'batch_number' => 'BATCH-' . now()->format('Ymd') . '-' . $drug->id,
                        'quantity_received' => $item->mapped_quantity,
                        'quantity_current' => 0,
                        'unit_cost' => $drug->default_unit_price ?? 0,
                        'unit_price' => $drug->default_unit_price ?? 0, // Selling price
                        'expiry_date' => now()->addYears(2), // Default 2-year expiry
                        'status' => 'active',
                        'received_date' => now(),
                    ]);
                }

                // Create inventory transaction record
                PharmacyInventoryTransaction::create([
                    'transaction_number' => PharmacyInventoryTransaction::generateTransactionNumber(),
                    'batch_id' => $batch->id,
                    'drug_id' => $drug->id,
                    'transaction_type' => 'dispensation',
                    'quantity' => -$item->mapped_quantity, // Negative for dispensation
                    'balance_before' => $balanceBefore,
                    'balance_after' => $drug->current_stock,
                    'reference_type' => 'prescription',
                    'reference_id' => $prescription->id,
                    'notes' => "Dispensed to patient #{$prescription->patient_id}",
                    'performed_by' => auth()->user()->id ?? 1,
                    'transaction_date' => now(),
                ]);
            }

            // Mark prescription as dispensed
            $prescription->update([
                'pharmacy_status' => 'dispensed',
                'dispensed_at' => now(), // This triggers PrescriptionObserver which handles billing automatically
                'dispensed_by_staff_id' => auth()->user()->id ?? null,
                'reviewed_by_pharmacist_id' => auth()->user()->id ?? null,
                'reviewed_at' => now(),
                'pharmacist_notes' => $validated['pharmacist_notes'] ?? null,
            ]);

            // ✅ BILLING IS HANDLED AUTOMATICALLY BY PrescriptionObserver
            // When dispensed_at is set above, the observer fires and:
            // 1. Gets or creates bill using BillingService
            // 2. Adds consultation fee (with duplicate check)
            // 3. Adds prescription items with correct quantities
            // 4. Recalculates bill totals
            //
            // OLD MANUAL BILLING CODE REMOVED TO PREVENT DOUBLE BILLING

            DB::commit();

            return response()->json([
                'message' => 'Prescription dispensed successfully',
                'prescription' => $prescription->load(['items.mappedDrug', 'patient', 'doctor'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Dispensing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove/unmap an item
     */
    public function unmapItem($itemId)
    {
        $item = PrescriptionItem::findOrFail($itemId);
        
        $item->update([
            'mapped_drug_id' => null,
            'mapped_quantity' => null,
        ]);

        return response()->json([
            'message' => 'Item unmapped successfully',
            'item' => $item
        ]);
    }

    /**
     * Get all available pharmacy drugs for mapping
     */
    public function availableDrugs(Request $request)
    {
        $search = $request->input('search');
        
        $query = PharmacyDrug::where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('generic_name', 'LIKE', "%{$search}%")
                  ->orWhere('brand_names', 'LIKE', "%{$search}%");
            });
        }

        $drugs = $query->select('id', 'generic_name', 'brand_names', 'dosage_form', 'strength', 'unit_of_measure', 'default_unit_price', 'current_stock')
            ->limit(50)
            ->get();

        return response()->json($drugs);
    }
}
