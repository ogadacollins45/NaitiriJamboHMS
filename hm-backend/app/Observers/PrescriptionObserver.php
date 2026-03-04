<?php

namespace App\Observers;

use App\Models\Prescription;
use App\Services\BillingService;
use Illuminate\Support\Facades\Log;

/**
 * SIMPLE Prescription Observer
 * Triggers billing when prescription is dispensed
 */
class PrescriptionObserver
{
    /**
     * When prescription is updated and marked as dispensed, add to bill
     */
    public function updated(Prescription $prescription): void
    {
        Log::info("PrescriptionObserver.updated() called for prescription #{$prescription->id}");
        Log::info("dispensed_at dirty: " . ($prescription->isDirty('dispensed_at') ? 'yes' : 'no'));
        Log::info("dispensed_at value: " . ($prescription->dispensed_at ?? 'null'));
        
        // Only trigger when dispensed_at is set
        if ($prescription->isDirty('dispensed_at') && $prescription->dispensed_at) {
            Log::info("PrescriptionObserver: Prescription #{$prescription->id} dispensed - adding to bill");

            try {
                if (!$prescription->treatment_id) {
                    Log::warning("PrescriptionObserver: No treatment_id for prescription #{$prescription->id}");
                    return;
                }

                $billingService = app(BillingService::class);
                $bill = $billingService->getOrCreateBillForTreatment($prescription->treatment_id);
                
                Log::info("PrescriptionObserver: Got/created bill #{$bill->id} for treatment #{$prescription->treatment_id}");
                
                // Add consultation fee
                $billingService->addConsultationFee($bill);
                
                // Add pharmacy items directly from prescription
                $this->addPrescriptionItemsToBill($bill, $prescription, $billingService);
                
                // Recalculate
                $billingService->recalculateBill($bill);

                Log::info("PrescriptionObserver: Successfully updated bill #{$bill->id} for prescription #{$prescription->id}");
            } catch (\Exception $e) {
                Log::error("PrescriptionObserver: Failed to update bill: " . $e->getMessage());
                Log::error($e->getTraceAsString());
            }
        } else {
            Log::info("PrescriptionObserver: Skipping - dispensed_at not changed or is null");
        }
    }

    /**
     * Add prescription items directly to bill
     * Now with duplicate prevention!
     */
    private function addPrescriptionItemsToBill($bill, $prescription, $billingService): void
    {
        foreach ($prescription->items as $item) {
            // Check if this prescription item is already billed
            $exists = \App\Models\BillItem::where('bill_id', $bill->id)
                ->where('prescription_item_id', $item->id)
                ->exists();

            if ($exists) {
                Log::info("PrescriptionObserver: Prescription item #{$item->id} already in bill #{$bill->id}, skipping");
                continue;
            }

            // Use unit_price from prescription or default to 100
            $unitPrice = $item->unit_price > 0 ? $item->unit_price : 100;
            // Use mapped_quantity (dispensed) if available, otherwise use quantity (prescribed)
            $quantity = $item->mapped_quantity > 0 ? $item->mapped_quantity : $item->quantity;
            $amount = $quantity * $unitPrice;

            \App\Models\BillItem::create([
                'bill_id' => $bill->id,
                'category' => 'prescription', // FIX: Changed from 'pharmacy' to match enum
                'description' => $item->drug_name_text . ' - ' . $item->dosage_text,
                'prescription_id' => $prescription->id,
                'prescription_item_id' => $item->id,
                'quantity' => $quantity, // FIXED: Use actual quantity, not static 1
                'amount' => $unitPrice,
                'subtotal' => $amount,
            ]);

            Log::info("PrescriptionObserver: Added prescription item '{$item->drug_name_text}' (qty: {$quantity}, unit: \${$unitPrice}) to bill #{$bill->id}");
        }
    }
}
