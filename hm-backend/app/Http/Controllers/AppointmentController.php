<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use App\Models\Treatment;
use App\Models\Doctor;

class AppointmentController extends Controller
{
    /**
     * Create a new appointment (S)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|integer|exists:patients,id',
            'doctor_id' => 'required|integer|exists:doctors,id',
            'appointment_time' => 'required|date',
        ]);

        $validated['status'] = 'Scheduled';

        $appointment = Appointment::create($validated);

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment
        ], 201);
    }

    /**
     * List all appointments for a patient or doctor
     */
    public function index(Request $request, $patient_id = null)
    {
        $query = Appointment::with(['patient', 'doctor']);

        // Filter by patient_id if provided in URL
        if ($patient_id) {
            $query->where('patient_id', $patient_id);
        }
        
        // Filter by doctor_id if provided as query parameter
        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        $appointments = $query->orderByDesc('appointment_time')->get();
        
        return response()->json($appointments);
    }

    public function complete($id)
    {
        $appointment = \App\Models\Appointment::with('doctor')->findOrFail($id);

        // Create new treatment from appointment
        $treatment = \App\Models\Treatment::create([
            'patient_id'       => $appointment->patient_id,
            'doctor_id'        => $appointment->doctor_id,
            'attending_doctor' => $appointment->doctor
                ? "Dr. {$appointment->doctor->first_name} {$appointment->doctor->last_name}"
                : null,
            'visit_date'       => now()->toDateString(),
            'diagnosis'        => null,
            'treatment_notes'  => 'Auto-created from completed appointment.',
            'status'           => 'active',
        ]);

        // Mark appointment as completed
        $appointment->status = 'Completed';
        $appointment->save();

        // Automatically create bill
        try {
            app(\App\Http\Controllers\BillingController::class)
                ->store(new \Illuminate\Http\Request([
                    'patient_id'   => $appointment->patient_id,
                    'treatment_id' => $treatment->id,
                    'doctor_id'    => $treatment->doctor_id ?? null,
                    'auto'         => true,
                ]));
        } catch (\Throwable $e) {
            \Log::error('Auto billing failed after appointment complete: ' . $e->getMessage());
        }

        return response()->json([
            'message'   => 'Appointment completed and treatment created successfully.',
            'treatment' => $treatment->load('doctor'),
        ]);
    }

    public function update(Request $request, $id)
{
    $appointment = Appointment::find($id);

    if (!$appointment) {
        return response()->json(['message' => 'Appointment not found'], 404);
    }

    $validated = $request->validate([
        'status' => 'required|string|in:scheduled,completed,cancelled',
    ]);

    $appointment->status = $validated['status'];
    $appointment->save();

    return response()->json([
        'message' => 'Appointment updated successfully',
        'appointment' => $appointment
    ]);
}


    }
