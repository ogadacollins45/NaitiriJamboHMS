<?php

namespace App\Http\Controllers;

use App\Models\PharmacyPrescription;
use App\Models\PharmacyPrescriptionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyPrescriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = PharmacyPrescription::with(['patient', 'doctor', 'items.drug']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->boolean('pending_only')) {
            $query->pending();
        }

        $prescriptions = $query->latest('prescribing_date')->paginate(20);

        return response()->json($prescriptions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'treatment_id' => 'nullable|exists:treatments,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'diagnosis' => 'nullable|string',
            'prescription_type' => 'in:inpatient,outpatient,emergency',
            'priority' => 'in:routine,urgent,stat',
            'valid_until' => 'nullable|date|after:today',
            'special_instructions' => 'nullable|string',
            'allergies_noted' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.drug_id' => 'required|exists:pharmacy_drugs,id',
            'items.*.quantity_prescribed' => 'required|integer|min:1',
            'items.*.dosage' => 'required|string',
            'items.*.frequency' => 'required|string',
            'items.*.route' => 'nullable|string',
            'items.*.duration_days' => 'nullable|integer|min:1',
            'items.*.duration_text' => 'nullable|string',
            'items.*.special_instructions' => 'nullable|string',
            'items.*.substitute_allowed' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $prescription = PharmacyPrescription::create([
                'prescription_number' => (new PharmacyPrescription())->generatePrescriptionNumber(),
                'patient_id' => $validated['patient_id'],
                'treatment_id' => $validated['treatment_id'] ?? null,
                'doctor_id' => $validated['doctor_id'] ?? $request->user()->id,
                'prescribing_date' => now(),
                'diagnosis' => $validated['diagnosis'] ?? null,
                'prescription_type' => $validated['prescription_type'] ?? 'outpatient',
                'priority' => $validated['priority'] ?? 'routine',
                'valid_until' => $validated['valid_until'] ?? null,
                'special_instructions' => $validated['special_instructions'] ?? null,
                'allergies_noted' => $validated['allergies_noted'] ?? null,
                'status' => 'active',
            ]);

            $totalEstimatedCost = 0;

            foreach ($validated['items'] as $itemData) {
                $item = PharmacyPrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'drug_id' => $itemData['drug_id'],
                    'quantity_prescribed' => $itemData['quantity_prescribed'],
                    'dosage' => $itemData['dosage'],
                    'frequency' => $itemData['frequency'],
                    'route' => $itemData['route'] ?? null,
                    'duration_days' => $itemData['duration_days'] ?? null,
                    'duration_text' => $itemData['duration_text'] ?? null,
                    'special_instructions' => $itemData['special_instructions'] ?? null,
                    'substitute_allowed' => $itemData['substitute_allowed'] ?? false,
                    'status' => 'pending',
                ]);

                // Estimate cost from drug's default price
                $drug = $item->drug;
                $estimatedCost = $drug->default_unit_price * $itemData['quantity_prescribed'];
                $totalEstimatedCost += $estimatedCost;

                $item->update([
                    'unit_price' => $drug->default_unit_price,
                    'line_total' => $estimatedCost,
                ]);
            }

            $prescription->update(['total_estimated_cost' => $totalEstimatedCost]);

            DB::commit();

            return response()->json([
                'message' => 'Prescription created successfully',
                'prescription' => $prescription->load(['items.drug', 'patient', 'doctor']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create prescription',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        $prescription = PharmacyPrescription::with([
            'patient',
            'doctor',
            'treatment',
            'items.drug',
            'dispensations.assignedPharmacist',
        ])->findOrFail($id);

        return response()->json($prescription);
    }

    public function cancel(Request $request, $id)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string',
        ]);

        $prescription = PharmacyPrescription::findOrFail($id);

        if ($prescription->status === 'fully_dispensed') {
            return response()->json([
                'message' => 'Cannot cancel fully dispensed prescription',
            ], 400);
        }

        $prescription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => $request->user()->id,
            'cancellation_reason' => $validated['cancellation_reason'],
        ]);

        return response()->json([
            'message' => 'Prescription cancelled',
            'prescription' => $prescription,
        ]);
    }
}
