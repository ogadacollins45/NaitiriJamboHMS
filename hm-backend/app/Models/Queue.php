<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory;

    protected $table = 'queue';

    protected $fillable = [
        'patient_id',
        'added_by',
        'status',
        'priority',
        'notes',
        'attended_at',
        'attended_by',
    ];

    protected $casts = [
        'attended_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function addedBy()
    {
        return $this->belongsTo(Staff::class, 'added_by');
    }

    public function attendedBy()
    {
        return $this->belongsTo(Staff::class, 'attended_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope to get only active queue items (waiting only)
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'waiting');
    }

    /**
     * Scope to get only waiting queue items
     */
    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }

    /**
     * Scope to get completed queue items
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to order by priority and creation time
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc')
                     ->orderBy('created_at', 'asc');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get wait time in minutes
     */
    public function getWaitTimeAttribute()
    {
        if ($this->attended_at) {
            return $this->created_at->diffInMinutes($this->attended_at);
        }

        return $this->created_at->diffInMinutes(now());
    }
}
