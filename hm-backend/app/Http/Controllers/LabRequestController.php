<?php

namespace App\Http\Controllers;

use App\Models\LabRequest;
use App\Models\LabRequestTest;
use App\Models\LabTestTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabRequestController extends Controller
{
    /**
     * Create a new lab request from treatment form
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'treatment_id' => 'nullable|exists:treatments,id',
            'priority' => 'required|in:routine,urgent,stat',
            'clinical_notes' => 'nullable|string',
            'test_ids' => 'required|array|min:1',
            'test_ids.*' => 'exists:lab_test_templates,id',
        ]);

        // Auto-resolve doctor_id for logged-in doctors (similar to TreatmentController)
        $user = $request->user();
        $doctorId = $validated['doctor_id'] ?? null;

        if (!$doctorId && $user && $user->role === 'doctor') {
            // Try matching doctor using email
            $doctor = \App\Models\Doctor::where('email', $user->email)->first();
            if ($doctor) {
                $doctorId = $doctor->id;
            }
        }

        if (!$doctorId) {
            return response()->json(['message' => 'Doctor assignment is required'], 422);
        }

        DB::beginTransaction();
        try {
            // Create lab request
            $labRequest = LabRequest::create([
                'request_number' => LabRequest::generateRequestNumber(),
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $doctorId,
                'treatment_id' => $validated['treatment_id'] ?? null,
                'priority' => $validated['priority'],
                'clinical_notes' => $validated['clinical_notes'] ?? null,
                'request_date' => now(),
                'status' => 'pending',
            ]);

            // Attach tests to request
            foreach ($validated['test_ids'] as $testId) {
                LabRequestTest::create([
                    'lab_request_id' => $labRequest->id,
                    'test_template_id' => $testId,
                    'status' => 'pending',
                    'priority' => $validated['priority'],
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Lab request created successfully',
                'request' => $labRequest->load(['tests.template', 'patient', 'doctor'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create lab request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get all lab requests (with filters)
     */
    public function index(Request $request)
    {
        $query = LabRequest::with(['patient', 'doctor', 'tests.template', 'labTechnician'])
            ->orderBy('created_at', 'desc');

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $perPage = $request->input('per_page', 15);
        $labRequests = $query->paginate($perPage);

        return response()->json($labRequests);
    }

    /**
     * Get lab requests for a specific patient with results
     */
    public function getByPatient($patient_id)
    {
        $labRequests = LabRequest::with([
            'tests.template.category',
            'tests.result.parameters.parameter',
            'doctor',
            'treatment',
            'labTechnician'
        ])
        ->where('patient_id', $patient_id)
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($labRequests);
    }

    /**
     * Get specific lab request
     */
    public function show($id)
    {
        $labRequest = LabRequest::with([
            'patient',
            'doctor',
            'treatment',
            'labTechnician',
            'tests.template.parameters',
            'tests.result.parameters.parameter',
            'samples'
        ])->findOrFail($id);

        return response()->json($labRequest);
    }

    /**
     * Cancel lab request
     */
    public function cancel($id)
    {
        $labRequest = LabRequest::findOrFail($id);

        if (!in_array($labRequest->status, ['pending', 'sample_collected'])) {
            return response()->json(['message' => 'Cannot cancel request in current status'], 400);
        }

        $labRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Lab request cancelled successfully']);
    }

    /**
     * Get available test templates
     */
    public function availableTests()
    {
        $tests = LabTestTemplate::with('category', 'parameters')
            ->active()
            ->get()
            ->groupBy('category.name');

        return response()->json($tests);
    }
}
