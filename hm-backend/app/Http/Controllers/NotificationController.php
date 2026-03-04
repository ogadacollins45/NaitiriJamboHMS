<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Return unread notifications for the authenticated user's role.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role ?? null;

        $notifications = Notification::whereJsonContains('target_roles', $role)
            ->orderByDesc('created_at')
            ->take(50)
            ->get()
            ->filter(fn($n) => !$n->isReadBy($user->id))
            ->values();

        return response()->json($notifications);
    }

    /**
     * POST /api/notifications/{id}/read
     * Mark a single notification as read for the current user.
     */
    public function markRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->markReadBy($request->user()->id);

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * POST /api/notifications/read-all
     * Mark all unread notifications as read for the current user.
     */
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        $role = $user->role ?? null;

        $notifications = Notification::whereJsonContains('target_roles', $role)
            ->orderByDesc('created_at')
            ->take(100)
            ->get()
            ->filter(fn($n) => !$n->isReadBy($user->id));

        foreach ($notifications as $notification) {
            $notification->markReadBy($user->id);
        }

        return response()->json(['message' => 'All marked as read']);
    }

}
