<?php

namespace App\Observers;

use App\Models\PharmacyDispensation;
use App\Models\Prescription;
use App\Services\BillingService;
use Illuminate\Support\Facades\Log;

class PharmacyDispensationObserver
{
    /**
     * Handle the PharmacyDispensation "created" event.
     * SIMPLIFIED: PharmacyDispensation.prescription_id now links directly to Prescription table
     */
    public function created(PharmacyDispensation $dispensation): void
    {
        Log::info("PharmacyDispensationObserver: Dispensation #{$dispensation->id} created");

        try {
            // Get treatment_id directly from the Prescription table
            $prescription = Prescription::find($dispensation->prescription_id);
            
            if (!$prescription) {
                Log::warning("PharmacyDispensationObserver: No prescription found for dispensation #{$dispensation->id}");
                return;
            }
            
            if (!$prescription->treatment_id) {
                Log::warning("PharmacyDispensationObserver: Prescription #{$prescription->id} has no treatment_id");
                return;
            }

            $treatmentId = $prescription->treatment_id;
            Log::info("PharmacyDispensationObserver: Found treatment_id {$treatmentId} for dispensation #{$dispensation->id}");

            $billingService = app(BillingService::class);
            $bill = $billingService->getOrCreateBillForTreatment($treatmentId);
            
            // Add consultation fee if this is the first bill activity
            $billingService->addConsultationFee($bill);
            
            // Add the dispensed items
            $billingService->addPharmacyDispensationItems($bill, $dispensation);
            
            // Recalculate totals
            $billingService->recalculateBill($bill);

            Log::info("PharmacyDispensationObserver: Successfully updated bill #{$bill->id} for dispensation #{$dispensation->id}");
        } catch (\Exception $e) {
            Log::error("PharmacyDispensationObserver: Failed to update bill for dispensation #{$dispensation->id}: " . $e->getMessage());
            Log::error($e->getTraceAsString());
        }
    }

    /**
     * Handle the PharmacyDispensation "deleted" event.
     * Remove items from bill if dispensation is cancelled
     */
    public function deleted(PharmacyDispensation $dispensation): void
    {
        Log::info("PharmacyDispensationObserver: Dispensation #{$dispensation->id} deleted");

        try {
            $prescription = $dispensation->prescription;
            
            if (!$prescription || !$prescription->treatment_id) {
                return;
            }

            $billingService = app(BillingService::class);
            $bill = $billingService->getOrCreateBillForTreatment($prescription->treatment_id);
            $billingService->removePharmacyDispensationItems($bill, $dispensation);

            Log::info("PharmacyDispensationObserver: Successfully removed items from bill #{$bill->id}");
        } catch (\Exception $e) {
            Log::error("PharmacyDispensationObserver: Failed to remove items from bill: " . $e->getMessage());
        }
    }
}
