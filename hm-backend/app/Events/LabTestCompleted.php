<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LabTestCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int    $notificationId;
    public string $title;
    public array  $body;
    public string $createdAt;

    public function __construct(
        int    $notificationId,
        string $title,
        array  $body,
        string $createdAt
    ) {
        $this->notificationId = $notificationId;
        $this->title          = $title;
        $this->body           = $body;
        $this->createdAt      = $createdAt;
    }

    /**
     * Broadcast on the public 'lab-notifications' channel.
     * The frontend checks the role itself — channel is public to avoid
     * needing per-user private channels for this shared notification.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('lab-notifications'),
        ];
    }

    /**
     * Name of the emitted event (what Echo listens for on the frontend).
     */
    public function broadcastAs(): string
    {
        return 'lab.test.completed';
    }

    /**
     * Data to send with the broadcast (available as event.detail in Echo).
     */
    public function broadcastWith(): array
    {
        return [
            'id'         => $this->notificationId,
            'type'       => 'lab_completed',
            'title'      => $this->title,
            'body'       => $this->body,
            'created_at' => $this->createdAt,
        ];
    }
}
