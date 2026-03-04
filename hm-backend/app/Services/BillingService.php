<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Treatment;
use App\Models\PharmacyDispensation;
use App\Models\LabRequest;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BillingService
{
    /**
     * Get or create a bill for a treatment
     * 
     * SMART BILLING LOGIC WITH TRANSACTION LOCKING:
     * - First treatment of day (type='new') → Creates NEW bill
     * - Same-day revisit (type='revisit') → Reuses EXISTING bill from first treatment
     * - All treatments link to the same bill via bill_id
     * - Uses database transaction with locking to prevent race conditions
     */
    public function getOrCreateBillForTreatment(int $treatmentId): Bill
    {
        $treatment = Treatment::with('patient')->findOrFail($treatmentId);
        
        // If treatment already has a bill_id, return that bill
        if ($treatment->bill_id) {
            Log::info("BillingService: Treatment #{$treatmentId} already linked to bill #{$treatment->bill_id}");
            return Bill::findOrFail($treatment->bill_id);
        }
        
        // Use database transaction with locking to prevent race conditions
        return DB::transaction(function () use ($treatment, $treatmentId) {
            // Refresh treatment within transaction to get latest data
            $treatment->refresh();
            
            // Double-check if bill_id was set by another concurrent request
            if ($treatment->bill_id) {
                Log::info("BillingService: Treatment #{$treatmentId} bill_id set by concurrent request - using bill #{$treatment->bill_id}");
                return Bill::findOrFail($treatment->bill_id);
            }
            
            // CRITICAL: Lock the patient record to prevent concurrent bill creation
            // This ensures only ONE bill is created for same-day treatments
            DB::table('patients')
                ->where('id', $treatment->patient_id)
                ->lockForUpdate()
                ->first();
            
            // Check for ANY existing bill for this patient on this day
            $existingBillForDay = DB::table('treatments')
                ->join('bills', 'treatments.bill_id', '=', 'bills.id')
                ->where('treatments.patient_id', $treatment->patient_id)
                ->whereDate('treatments.visit_date', $treatment->visit_date)
                ->where('treatments.id', '!=', $treatmentId)
                ->select('bills.id')
                ->first();
            
            if ($existingBillForDay) {
                $bill = Bill::findOrFail($existingBillForDay->id);
                
                // Update payment method from latest treatment
                if ($treatment->payment_type) {
                    $bill->update(['payment_method' => $treatment->payment_type]);
                }
                
                $treatment->update(['bill_id' => $bill->id]);
                
                Log::info("BillingService: Found existing bill #{$bill->id} for same day - linked treatment #{$treatmentId} and updated payment method to {$treatment->payment_type}");
                return $bill;
            }
            
            // No existing bill - create new one
            Log::info("BillingService: Creating NEW bill for treatment #{$treatmentId} (type: {$treatment->treatment_type})");
            
            $bill = Bill::create([
                'patient_id'     => $treatment->patient_id,
                'treatment_id'   => $treatmentId,
                'doctor_id'      => $treatment->doctor_id,
                'payment_method' => $treatment->payment_type, // Copy from treatment
                'subtotal'       => 0,
                'discount'       => 0,
                'tax'            => 0,
                'total_amount'   => 0,
                'status'         => 'unpaid',
            ]);
            
            // Link treatment to bill
            $treatment->update(['bill_id' => $bill->id]);
            
            Log::info("BillingService: Created bill #{$bill->id} for treatment #{$treatmentId}");
            return $bill;
        });
    }

    /**
     * Add consultation fee to bill (if not already added)
     */
    public function addConsultationFee(Bill $bill): void
    {
        // Check if consultation fee already exists
        $exists = BillItem::where('bill_id', $bill->id)
            ->where('category', 'consultation')
            ->exists();

        if ($exists) {
            Log::info("BillingService: Consultation fee already exists for bill #{$bill->id}");
            return;
        }

        $consultationFee = (float) Setting::getSetting('consultation_fee', 3.00);

        BillItem::create([
            'bill_id'     => $bill->id,
            'category'    => 'consultation',
            'description' => 'Consultation Fee',
            'quantity'    => 1,
            'amount'      => $consultationFee,
            'subtotal'    => $consultationFee,
        ]);

        Log::info("BillingService: Added consultation fee ({$consultationFee}) to bill #{$bill->id}");
    }

    /**
     * Add pharmacy dispensation items to bill
     */
    public function addPharmacyDispensationItems(Bill $bill, PharmacyDispensation $dispensation): void
    {
        Log::info("BillingService: Adding pharmacy dispensation #{$dispensation->id} to bill #{$bill->id}");

        foreach ($dispensation->items as $item) {
            // Check if this item is already in the bill
            $exists = BillItem::where('bill_id', $bill->id)
                ->where('pharmacy_dispensation_item_id', $item->id)
                ->exists();

            if ($exists) {
                Log::info("BillingService: Dispensation item #{$item->id} already in bill #{$bill->id}");
                continue;
            }

            $drugName = $item->drug ? $item->drug->generic_name : ($item->batch_number ?? 'Drug');
            $qty = (int) $item->quantity_dispensed;
            $unit = (float) $item->unit_price;
            $line = (float) $item->line_total;

            BillItem::create([
                'bill_id'                       => $bill->id,
                'category'                      => 'prescription',
                'description'                   => $drugName,
                'quantity'                      => $qty,
                'amount'                        => $unit,
                'subtotal'                      => $line,
                'pharmacy_dispensation_id'      => $dispensation->id,
                'pharmacy_dispensation_item_id' => $item->id,
            ]);

            Log::info("BillingService: Added drug '{$drugName}' (qty: {$qty}, price: {$unit}) to bill #{$bill->id}");
        }
    }

    /**
     * Add lab test items to bill
     * ONLY adds COMPLETED tests
     */
    public function addLabTestItems(Bill $bill, LabRequest $labRequest): void
    {
        Log::info("BillingService: Adding lab request #{$labRequest->id} to bill #{$bill->id}");

        foreach ($labRequest->tests as $test) {
            // CRITICAL: Only bill completed tests
            if ($test->status !== 'completed') {
                Log::info("BillingService: Skipping test #{$test->id} - status: {$test->status} (not completed)");
                continue;
            }

            // Check if this test is already in the bill
            $exists = BillItem::where('bill_id', $bill->id)
                ->where('lab_test_id', $test->id)
                ->exists();

            if ($exists) {
                Log::info("BillingService: Lab test #{$test->id} already in bill #{$bill->id}");
                continue;
            }

            $testTemplate = $test->template;
            
            if ($testTemplate && $testTemplate->price > 0) {
                BillItem::create([
                    'bill_id'        => $bill->id,
                    'category'       => 'lab_test',
                    'description'    => $testTemplate->name,
                    'lab_request_id' => $labRequest->id,
                    'lab_test_id'    => $test->id,
                    'quantity'       => 1,
                    'amount'         => $testTemplate->price,
                    'subtotal'       => $testTemplate->price,
                ]);

                Log::info("BillingService: Added COMPLETED lab test '{$testTemplate->name}' (price: {$testTemplate->price}) to bill #{$bill->id}");
            }
        }
    }

    /**
     * Recalculate bill totals from items
     */
    public function recalculateBill(Bill $bill): void
    {
        $subtotal = (float) $bill->items()->sum('subtotal');
        $discount = (float) $bill->discount;
        $tax = (float) $bill->tax;
        $total = max(0, $subtotal - $discount + $tax);

        $bill->update([
            'subtotal'     => $subtotal,
            'total_amount' => $total,
        ]);

        Log::info("BillingService: Recalculated bill #{$bill->id} - Subtotal: {$subtotal}, Total: {$total}");
    }

    /**
     * Refresh bill from treatment - regenerate from scratch
     * ❌ DISABLED - This method deletes all items causing overwrite issues
     * Bills should be built incrementally by observers only
     */
    public function refreshBillFromTreatment(int $treatmentId): Bill
    {
        Log::warning("refreshBillFromTreatment called for treatment #{$treatmentId} - this should not be used!");
        Log::warning("Bills should be built incrementally by observers, not refreshed");

        return DB::transaction(function () use ($treatmentId) {
            $treatment = Treatment::findOrFail($treatmentId);
            $bill = $this->getOrCreateBillForTreatment($treatmentId);

            // ❌ DISABLED - DO NOT DELETE ITEMS
            // This was causing lab tests and prescriptions to overwrite each other
            // $bill->items()->delete();
            
            Log::info("BillingService: Returning existing bill #{$bill->id} WITHOUT refresh");

            // Just add consultation fee if missing
            $this->addConsultationFee($bill);
            
            // Recalculate totals from existing items
            $this->recalculateBill($bill);

            return $bill->fresh(['items', 'payments', 'patient', 'doctor', 'treatment']);
        });
    }

    /**
     * Remove pharmacy dispensation items from bill
     * (useful if dispensation is cancelled)
     */
    public function removePharmacyDispensationItems(Bill $bill, PharmacyDispensation $dispensation): void
    {
        BillItem::where('bill_id', $bill->id)
            ->where('pharmacy_dispensation_id', $dispensation->id)
            ->delete();

        Log::info("BillingService: Removed pharmacy dispensation #{$dispensation->id} items from bill #{$bill->id}");
        
        $this->recalculateBill($bill);
    }

    /**
     * Remove lab request items from bill
     * (useful if lab request is cancelled)
     */
    public function removeLabRequestItems(Bill $bill, LabRequest $labRequest): void
    {
        BillItem::where('bill_id', $bill->id)
            ->where('lab_request_id', $labRequest->id)
            ->delete();

        Log::info("BillingService: Removed lab request #{$labRequest->id} items from bill #{$bill->id}");
        
        $this->recalculateBill($bill);
    }
}
