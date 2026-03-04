<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabSample extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_request_id',
        'sample_number',
        'sample_type',
        'collection_date',
        'collected_by',
        'volume',
        'container_type',
        'storage_location',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'collection_date' => 'datetime',
    ];

    // Relationships
    public function labRequest()
    {
        return $this->belongsTo(LabRequest::class, 'lab_request_id');
    }

    public function collectedBy()
    {
        return $this->belongsTo(Staff::class, 'collected_by');
    }

    // Helper to generate sample number
    public static function generateSampleNumber()
    {
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return "SMP-{$date}-" . str_pad($count, 5, '0', STR_PAD_LEFT);
    }
}
