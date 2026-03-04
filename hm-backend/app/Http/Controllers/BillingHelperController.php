<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Treatment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillingHelperController extends Controller
{
    /**
     * Return a list of patients who have treatments and are ready for billing.
     * Includes consultation fee + prescription total.
     */
    public function getBillablePatients()
    {
        // Get consultation fee from settings (default 3.00)
        $consultationFee = (float) \App\Models\Setting::getSetting('consultation_fee', 3.00);

        // Get all patients with at least one treatment
        $patients = Patient::with(['treatments' => function ($q) {
            $q->latest('visit_date');
        }, 'treatments.prescriptions'])
            ->whereHas('treatments')
            ->get();

        // Build response
        $data = $patients->map(function ($patient) use ($consultationFee) {
            $latestTreatment = $patient->treatments->first();
            $hasPrescription = false;
            $prescriptionTotal = 0;

            if ($latestTreatment && $latestTreatment->prescriptions) {
                $hasPrescription = $latestTreatment->prescriptions->isNotEmpty();
                $prescriptionTotal = $latestTreatment->prescriptions->sum('total_amount');
            }

            return [
                'id' => $patient->id,
                'name' => "{$patient->first_name} {$patient->last_name}",
                'treatment_id' => $latestTreatment->id ?? null,
                'treatment_date' => $latestTreatment->visit_date ?? null,
                'has_prescription' => $hasPrescription,
                'consultation_fee' => $consultationFee,
                'prescription_total' => round($prescriptionTotal, 2),
                'total_due' => round($consultationFee + $prescriptionTotal, 2),
            ];
        });

        // Sort by latest treatment date descending
        $sorted = $data->sortByDesc('treatment_date')->values();

        return response()->json($sorted);
    }
}
