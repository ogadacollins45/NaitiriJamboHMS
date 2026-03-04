<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QueueController extends Controller
{
    /**
     * Get all active queue items
     * Returns patients waiting or being attended to
     */
    public function index()
    {
        $queueItems = Queue::with(['patient', 'addedBy', 'attendedBy'])
            ->active()
            ->ordered()
            ->get();

        return response()->json($queueItems);
    }

    /**
     * Add a patient to the queue
     * Only admin and reception can add patients
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $role = $user->role ?? null;

        // Check if user has permission (admin or reception)
        if (!in_array($role, ['admin', 'reception'])) {
            return response()->json([
                'message' => 'Only admin and reception users can add patients to the queue'
            ], 403);
        }

        // Check if patient is already in active queue
        $existingQueue = Queue::where('patient_id', $validated['patient_id'])
            ->active()
            ->first();

        if ($existingQueue) {
            return response()->json([
                'message' => 'Patient is already in the queue'
            ], 422);
        }

        // Get patient info for response
        $patient = Patient::find($validated['patient_id']);

        // Create queue entry
        $queueItem = Queue::create([
            'patient_id' => $validated['patient_id'],
            'added_by' => $user->id,
            'notes' => $validated['notes'] ?? null,
            'status' => 'waiting',
            'priority' => 0,
        ]);

        // Load relationships
        $queueItem->load(['patient', 'addedBy']);

        return response()->json([
            'message' => "Patient {$patient->first_name} {$patient->last_name} added to queue",
            'data' => $queueItem
        ], 201);
    }

    /**
     * Mark patient as being attended to
     * Doctor clicks "Attend to Patient"
     */
    public function attend(Request $request, $id)
    {
        $user = $request->user();
        $role = $user->role ?? null;

        // Only doctors and admins can attend
        if (!in_array($role, ['admin', 'doctor'])) {
            return response()->json([
                'message' => 'Only doctors can attend to patients'
            ], 403);
        }

        $queueItem = Queue::find($id);

        if (!$queueItem) {
            return response()->json(['message' => 'Queue item not found'], 404);
        }

        // Update status to completed
        $queueItem->update([
            'status' => 'completed',
            'attended_at' => now(),
            'attended_by' => $user->id,
        ]);

        $queueItem->load(['patient', 'attendedBy']);

        return response()->json([
            'message' => 'Patient attendance started',
            'data' => $queueItem
        ]);
    }



    /**
     * Remove patient from queue
     * Only admin and reception can remove
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $role = $user->role ?? null;

        // Check permission
        if (!in_array($role, ['admin', 'reception'])) {
            return response()->json([
                'message' => 'Only admin and reception users can remove patients from the queue'
            ], 403);
        }

        $queueItem = Queue::find($id);

        if (!$queueItem) {
            return response()->json(['message' => 'Queue item not found'], 404);
        }

        // Mark as removed instead of deleting
        $queueItem->update([
            'status' => 'removed',
        ]);

        return response()->json([
            'message' => 'Patient removed from queue'
        ]);
    }

    /**
     * Get attended patients statistics
     */
    public function getAttendedStats()
    {
        $stats = [
            'attended_today' => Queue::where('status', 'completed')
                ->whereDate('attended_at', today())
                ->count(),
            'attended_this_week' => Queue::where('status', 'completed')
                ->whereBetween('attended_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->count(),
            'attended_this_month' => Queue::where('status', 'completed')
                ->whereMonth('attended_at', now()->month)
                ->whereYear('attended_at', now()->year)
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get queue statistics
     */
    public function stats()
    {
        $stats = [
            'total_waiting' => Queue::waiting()->count(),
            'average_wait_time' => $this->getAverageWaitTime(),
        ];

        return response()->json($stats);
    }

    /**
     * Calculate average wait time in minutes
     */
    private function getAverageWaitTime()
    {
        $completedToday = Queue::whereIn('status', ['completed', 'in_progress'])
            ->whereDate('created_at', today())
            ->get();

        if ($completedToday->isEmpty()) {
            return 0;
        }

        $totalMinutes = $completedToday->sum(function ($item) {
            if ($item->attended_at) {
                return $item->created_at->diffInMinutes($item->attended_at);
            }
            return 0;
        });

        return round($totalMinutes / $completedToday->count(), 1);
    }
}
