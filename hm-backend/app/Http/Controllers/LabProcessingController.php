<?php

namespace App\Http\Controllers;

use App\Models\LabRequest;
use App\Models\LabRequestTest;
use App\Models\LabSample;
use App\Models\LabResult;
use App\Models\LabResultParameter;
use App\Models\LabTestParameter;
use App\Models\Notification;
use App\Events\LabTestCompleted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabProcessingController extends Controller
{
    /**
     * Get pending lab requests for processing
     */
    public function pending(Request $request)
    {
        $query = LabRequest::with(['patient', 'doctor', 'tests.template'])
            ->whereIn('status', ['pending', 'sample_collected', 'processing'])
            ->orderByRaw("FIELD(priority, 'stat', 'urgent', 'routine')")
            ->orderBy('created_at', 'asc');

        // Add search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('request_number', 'like', "%{$searchTerm}%")
                  ->orWhereHas('patient', function($pq) use ($searchTerm) {
                      $pq->where('first_name', 'like', "%{$searchTerm}%")
                        ->orWhere('last_name', 'like', "%{$searchTerm}%")
                        ->orWhere('upid', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // Filter by today's date
        if ($request->has('today_only') && $request->today_only == 'true') {
            $query->whereDate('request_date', today());
        }

        // Existing filters
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('priority') && $request->priority) {
            $query->where('priority', $request->priority);
        }

        $perPage = $request->input('per_page', 20);
        return response()->json($query->paginate($perPage));
    }

    /**
     * Accept lab request
     */
    public function acceptRequest($id)
    {
        $labRequest = LabRequest::findOrFail($id);
        
        $labRequest->update([
            'lab_technician_id' => auth()->user()->id,
            'status' => 'sample_collected',
        ]);

        return response()->json(['message' => 'Request accepted successfully', 'request' => $labRequest]);
    }

    /**
     * Record sample collection
     */
    public function recordSample(Request $request, $id)
    {
        $validated = $request->validate([
            'sample_type' => 'required|in:blood,urine,stool,sputum,csf,tissue,swab,fluid,other',
            'volume' => 'nullable|string',
            'container_type' => 'nullable|string',
            'storage_location' => 'nullable|string',
        ]);

        $labRequest = LabRequest::findOrFail($id);

        $sample = LabSample::create([
            'lab_request_id' => $labRequest->id,
            'sample_number' => LabSample::generateSampleNumber(),
            'sample_type' => $validated['sample_type'],
            'collection_date' => now(),
            'collected_by' => auth()->user()->id,
            'volume' => $validated['volume'] ?? null,
            'container_type' => $validated['container_type'] ?? null,
            'storage_location' => $validated['storage_location'] ?? null,
            'status' => 'collected',
        ]);

        $labRequest->update(['status' => 'processing']);

        return response()->json(['message' => 'Sample recorded successfully', 'sample' => $sample]);
    }

    /**
     * Submit test results
     */
    public function submitResults(Request $request, $id, $testId)
    {
        $validated = $request->validate([
            'parameters' => 'nullable|array',  // Changed from 'required' to 'nullable' for tests without parameters
            'parameters.*.parameter_id' => 'required_with:parameters|exists:lab_test_parameters,id',
            'parameters.*.value' => 'nullable|string',
            'overall_comment' => 'nullable|string',
        ]);

        $labRequest = LabRequest::findOrFail($id);
        $requestTest = LabRequestTest::where('lab_request_id', $id)
            ->where('id', $testId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Create result
            $result = LabResult::create([
                'lab_request_test_id' => $requestTest->id,
                'lab_request_id' => $labRequest->id,
                'test_template_id' => $requestTest->test_template_id,
                'performed_by' => auth()->user()->id,
                'performed_at' => now(),
                'status' => 'submitted',
                'overall_comment' => $validated['overall_comment'] ?? null,
                'quality_control_passed' => true,
            ]);

            // Add parameter values (if any exist)
            if (!empty($validated['parameters'])) {
                foreach ($validated['parameters'] as $paramData) {
                    $parameter = LabTestParameter::findOrFail($paramData['parameter_id']);
                    $value = $paramData['value'];

                    // Auto-detect abnormal values
                    $isAbnormal = $parameter->isAbnormal($value);
                    $abnormalFlag = $parameter->getAbnormalFlag($value);
                    $referenceRange = $parameter->getReferenceRange();

                    LabResultParameter::create([
                        'lab_result_id' => $result->id,
                        'parameter_id' => $parameter->id,
                        'value' => $value,
                        'unit' => $parameter->unit,
                        'is_abnormal' => $isAbnormal,
                        'abnormal_flag' => $abnormalFlag,
                        'reference_range' => $referenceRange,
                    ]);
                }
            }

            // Update test status
            $requestTest->update(['status' => 'completed']);

            // Check if all tests completed
            $allCompleted = $labRequest->tests()->where('status', '!=', 'completed')->count() === 0;
            if ($allCompleted) {
                $labRequest->update([
                    'status'      => 'completed',
                    'reviewed_at' => now(),
                ]);

                // 🔔 Notify all doctors and admins that results are ready
                $labRequest->load('patient');
                $patientName = $labRequest->patient
                    ? trim(($labRequest->patient->first_name ?? '') . ' ' . ($labRequest->patient->last_name ?? ''))
                    : 'Unknown Patient';

                $notificationBody = [
                    'patient'      => $patientName,
                    'request_no'   => $labRequest->request_number,
                    'patient_id'   => $labRequest->patient_id,
                    'treatment_id' => $labRequest->treatment_id,
                ];

                $notification = Notification::create([
                    'type'         => 'lab_completed',
                    'title'        => 'Lab Results Ready',
                    'body'         => $notificationBody,
                    'target_roles' => ['doctor', 'admin'],
                    'is_read_by'   => [],
                ]);

                // 📡 Broadcast via Reverb WebSocket — instant push, zero DB polling
                broadcast(new LabTestCompleted(
                    notificationId: $notification->id,
                    title:          'Lab Results Ready',
                    body:           $notificationBody,
                    createdAt:      $notification->created_at->toIso8601String(),
                ));
            }

            DB::commit();

            return response()->json([
                'message' => 'Results submitted successfully',
                'result' => $result->load('parameters.parameter')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit results: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject sample
     */
    public function rejectSample(Request $request, $id)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $labRequest = LabRequest::findOrFail($id);
        
        $sample = $labRequest->samples()->latest()->first();
        if ($sample) {
            $sample->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'],
            ]);
        }

        $labRequest->update(['status' => 'rejected']);

        return response()->json(['message' => 'Sample rejected successfully']);
    }

    /**
     * Save draft test results
     */
    public function saveDraft(Request $request, $id, $testId)
    {
        $validated = $request->validate([
            'parameters' => 'nullable|array',
            'parameters.*.parameter_id' => 'required_with:parameters|exists:lab_test_parameters,id',
            'parameters.*.value' => 'nullable|string',
            'overall_comment' => 'nullable|string',
        ]);

        // Store draft in cache/session with user-specific key
        $draftKey = "lab_draft_{$id}_{$testId}_" . auth()->id();
        
        cache()->put($draftKey, [
            'parameters' => $validated['parameters'] ?? [],
            'overall_comment' => $validated['overall_comment'] ?? '',
            'saved_at' => now()->toDateTimeString(),
        ], now()->addDays(7)); // Keep draft for 7 days

        return response()->json([
            'message' => 'Draft saved successfully',
            'saved_at' => now()->toDateTimeString()
        ]);
    }

   /**
     * Get draft test results
     */
    public function getDraft($id, $testId)
    {
        $draftKey = "lab_draft_{$id}_{$testId}_" . auth()->id();
        $draft = cache()->get($draftKey);

        if (!$draft) {
            return response()->json([
                'draft' => null,
                'message' => 'No draft found'
            ]);
        }

        return response()->json([
            'draft' => $draft,
            'message' => 'Draft loaded successfully'
        ]);
    }

    /**
     * Delete draft test results
     */
    public function deleteDraft($id, $testId)
    {
        $draftKey = "lab_draft_{$id}_{$testId}_" . auth()->id();
        cache()->forget($draftKey);

        return response()->json(['message' => 'Draft deleted successfully']);
    }
}
