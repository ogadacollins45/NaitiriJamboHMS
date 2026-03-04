<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Admission;
use App\Models\AdmissionEntry;
use App\Models\Bill;
use App\Models\Patient;

class AdmissionController extends Controller
{
    /**
     * List all admissions (optionally filtered by status).
     */
    public function index(Request $request)
    {
        $query = Admission::with(['patient', 'doctor'])
            ->orderByDesc('admitted_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'like', "%$search%")
                    ->orWhere('last_name', 'like', "%$search%")
                    ->orWhere('upid', 'like', "%$search%");
            });
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Admit a patient. Prevents duplicate active admissions.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'     => 'required|exists:patients,id',
            'doctor_id'      => 'nullable|exists:doctors,id',
            'ward'           => 'required|string|max:100',
            'bed'            => 'nullable|string|max:100',
            'admission_type' => 'required|in:general,maternity',
            'payment_type'   => 'nullable|string|max:50',
            'reason'         => 'nullable|string',
        ]);

        // Check for existing active admission
        $existing = Admission::where('patient_id', $validated['patient_id'])
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json([
                'message'   => 'Patient already has an active admission.',
                'admission' => $existing->load(['patient', 'doctor']),
            ], 409);
        }

        try {
            $admission = DB::transaction(function () use ($validated) {
                return Admission::create(array_merge($validated, [
                    'admitted_at' => now(),
                    'status'      => 'active',
                ]));
            });

            return response()->json([
                'message'   => 'Patient admitted successfully.',
                'admission' => $admission->load(['patient', 'doctor']),
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Admission creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to admit patient.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show a single admission with entries and bill.
     */
    public function show($id)
    {
        $admission = Admission::with([
            'patient',
            'doctor',
            'entries.user',
            'bill.items',
            'bill.payments',
        ])->findOrFail($id);

        return response()->json($admission);
    }

    /**
     * Get the active admission for a patient, if any.
     */
    public function getActiveForPatient($patientId)
    {
        $admission = Admission::with(['patient', 'doctor', 'entries.user', 'bill'])
            ->where('patient_id', $patientId)
            ->where('status', 'active')
            ->latest()
            ->first();

        if (!$admission) {
            return response()->json(['admission' => null]);
        }

        return response()->json(['admission' => $admission]);
    }

    /**
     * Add a Cardex / timeline entry to an admission.
     */
    public function addEntry(Request $request, $id)
    {
        $admission = Admission::findOrFail($id);

        // Only active admissions can receive entries
        if (!$admission->isActive()) {
            return response()->json([
                'message' => 'Cannot add entries to a non-active admission.',
            ], 422);
        }

        $validated = $request->validate([
            'bp'          => 'nullable|string|max:20',
            'pulse'       => 'nullable|string|max:20',
            'temp'        => 'nullable|string|max:20',
            'spo2'        => 'nullable|string|max:20',
            'note'        => 'nullable|string',
            'recorded_at' => 'nullable|date',
        ]);

        // Super Admin (id=999999) has no row in the `users` table, so only
        // set user_id when the authenticated user actually exists there.
        $authUserId = auth()->id();
        $resolvedUserId = ($authUserId && \DB::table('users')->where('id', $authUserId)->exists())
            ? $authUserId
            : null;

        $entry = $admission->entries()->create([
            'user_id'     => $resolvedUserId,
            'bp'          => $validated['bp'] ?? null,
            'pulse'       => $validated['pulse'] ?? null,
            'temp'        => $validated['temp'] ?? null,
            'spo2'        => $validated['spo2'] ?? null,
            'note'        => $validated['note'] ?? null,
            'recorded_at' => $validated['recorded_at'] ?? now(),
        ]);

        return response()->json([
            'message' => 'Entry added successfully.',
            'entry'   => $entry->load('user'),
        ], 201);
    }

    /**
     * Discharge a patient. Closes the admission and optionally creates a bill.
     */
    public function discharge(Request $request, $id)
    {
        $admission = Admission::with(['patient', 'doctor'])->findOrFail($id);

        if (!$admission->isActive()) {
            return response()->json([
                'message' => 'This admission is not active and cannot be discharged.',
            ], 422);
        }

        $validated = $request->validate([
            'discharge_note' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($admission, $validated) {
                $admission->update([
                    'status'         => 'discharged',
                    'discharged_at'  => now(),
                    'discharge_note' => $validated['discharge_note'] ?? null,
                ]);

                // Create an inpatient bill if one doesn't exist yet
                $bill = Bill::where('admission_id', $admission->id)->first();

                if (!$bill) {
                    $bill = Bill::create([
                        'patient_id'    => $admission->patient_id,
                        'doctor_id'     => $admission->doctor_id,
                        'admission_id'  => $admission->id,
                        'bill_type'     => 'inpatient',
                        'payment_method'=> $admission->payment_type,
                        'subtotal'      => 0,
                        'discount'      => 0,
                        'tax'           => 0,
                        'total_amount'  => 0,
                        'status'        => 'unpaid',
                        'notes'         => 'Inpatient bill - ' . ($admission->ward) . ' ward',
                    ]);

                    Log::info("AdmissionController: Created inpatient bill #{$bill->id} on discharge of admission #{$admission->id}");
                }
            });

            $admission->refresh();

            return response()->json([
                'message'   => 'Patient discharged successfully.',
                'admission' => $admission->load(['patient', 'doctor', 'bill']),
            ]);

        } catch (\Throwable $e) {
            Log::error('Discharge failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to discharge patient.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get bill for an admission (create stub if needed).
     */
    public function getBill($id)
    {
        $admission = Admission::with(['patient', 'doctor'])->findOrFail($id);

        $bill = Bill::with(['items', 'payments', 'patient', 'doctor'])
            ->where('admission_id', $id)
            ->first();

        if (!$bill) {
            return response()->json([
                'id'           => null,
                'admission_id' => $id,
                'patient_id'   => $admission->patient_id,
                'items'        => [],
                'payments'     => [],
                'subtotal'     => 0,
                'total_amount' => 0,
                'status'       => 'unpaid',
                'bill_type'    => 'inpatient',
                'patient'      => $admission->patient,
                'doctor'       => $admission->doctor,
            ]);
        }

        return response()->json($bill);
    }
}
