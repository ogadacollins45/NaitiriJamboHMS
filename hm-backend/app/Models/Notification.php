<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'body',
        'target_roles',
        'is_read_by',
    ];

    protected $casts = [
        'body'         => 'array',
        'target_roles' => 'array',
        'is_read_by'   => 'array',
    ];

    /**
     * Has this user already dismissed/read this notification?
     */
    public function isReadBy(int $userId): bool
    {
        return in_array($userId, $this->is_read_by ?? []);
    }

    /**
     * Mark as read for a given user (adds their ID to is_read_by array).
     */
    public function markReadBy(int $userId): void
    {
        $readers = $this->is_read_by ?? [];
        if (!in_array($userId, $readers)) {
            $readers[] = $userId;
            $this->update(['is_read_by' => $readers]);
        }
    }
}
