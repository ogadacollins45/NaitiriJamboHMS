<?php

namespace App\Observers;

use App\Models\LabRequest;
use App\Services\BillingService;
use Illuminate\Support\Facades\Log;

class LabRequestObserver
{
    /**
     * Handle the LabRequest "updated" event.
     * Automatically update the bill when lab tests are COMPLETED (results submitted)
     */
    public function updated(LabRequest $labRequest): void
    {
        // Only trigger billing when status changes to 'completed'
        if ($labRequest->isDirty('status') && $labRequest->status === 'completed') {
            Log::info("LabRequestObserver: Lab request #{$labRequest->id} completed - adding to bill");

            try {
                if (!$labRequest->treatment_id) {
                    Log::warning("LabRequestObserver: No treatment found for lab request #{$labRequest->id}");
                    return;
                }

                $billingService = app(BillingService::class);
                $bill = $billingService->getOrCreateBillForTreatment($labRequest->treatment_id);
                
                // Add consultation fee if this is the first bill activity
                $billingService->addConsultationFee($bill);
                
                // Add the lab test items
                $billingService->addLabTestItems($bill, $labRequest);
                
                // Recalculate totals
                $billingService->recalculateBill($bill);

                Log::info("LabRequestObserver: Successfully updated bill #{$bill->id} for completed lab request #{$labRequest->id}");
            } catch (\Exception $e) {
                Log::error("LabRequestObserver: Failed to update bill for lab request #{$labRequest->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle the LabRequest "deleted" event.
     * Remove items from bill if lab request is cancelled
     */
    public function deleted(LabRequest $labRequest): void
    {
        Log::info("LabRequestObserver: Lab request #{$labRequest->id} deleted");

        try {
            if (!$labRequest->treatment_id) {
                return;
            }

            $billingService = app(BillingService::class);
            $bill = $billingService->getOrCreateBillForTreatment($labRequest->treatment_id);
            $billingService->removeLabRequestItems($bill, $labRequest);

            Log::info("LabRequestObserver: Successfully removed items from bill #{$bill->id}");
        } catch (\Exception $e) {
            Log::error("LabRequestObserver: Failed to remove items from bill: " . $e->getMessage());
        }
    }
}
