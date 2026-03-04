<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SIMPLE Pharmacy Dispensation Controller
 * Works directly with Prescription table - NO complex pharmacy tables!
 */
class SimplePharmacyController extends Controller
{
    /**
     * Get pending prescriptions
     */
    public function pending(Request $request)
    {
        $prescriptions = Prescription::with(['patient', 'treatment', 'doctor', 'items'])
            ->where('pharmacy_status', 'sent_to_pharmacy')
            ->whereNull('dispensed_at') // Not yet dispensed
            ->orderBy('created_at', 'desc')
            ->get();

        // Format for frontend
        $formatted = $prescriptions->map(function ($prescription) {
            return [
                'id' => $prescription->id,
                'prescription_number' => 'RX-' . str_pad($prescription->id, 6, '0', STR_PAD_LEFT),
                'patient' => $prescription->patient,
                'doctor' => $prescription->doctor,
                'treatment' => $prescription->treatment,
                'priority' => 'routine',
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

        return response()->json(['data' => $formatted]);
    }

    /**
     * Mark prescription as dispensed - THIS TRIGGERS BILLING!
     */
    public function dispense(Request $request)
    {
        $validated = $request->validate([
            'prescription_id' => 'required|exists:prescriptions,id',
            'dispensing_notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $prescription = Prescription::with('treatment')->findOrFail($validated['prescription_id']);

            // Simple: just mark as dispensed
            $prescription->update([
                'dispensed_at' => now(),
                'dispensed_by_staff_id' => $request->user()->id,
                'dispensing_notes' => $validated['dispensing_notes'] ?? null,
                'pharmacy_status' => 'dispensed',
            ]);

            // Update PharmacyOrder status if exists
            \App\Models\PharmacyOrder::where('prescription_id', $prescription->id)
                ->update(['status' => 'dispensed', 'dispensed_at' => now()]);

            DB::commit();

            Log::info("Simple dispensation: Prescription #{$prescription->id} marked as dispensed for treatment #{$prescription->treatment_id}");

            // The PrescriptionObserver will trigger billing!

            return response()->json([
                'message' => 'Prescription dispensed successfully',
                'prescription' => $prescription,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Dispensation failed: ' . $e->getMessage());
            
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
