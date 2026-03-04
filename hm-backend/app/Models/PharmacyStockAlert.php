<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyStockAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'alert_type', 'severity', 'drug_id', 'batch_id', 'message',
        'threshold_value', 'current_value', 'expiry_date', 'days_to_expiry',
        'alert_data', 'recommended_action', 'is_acknowledged',
        'acknowledged_by', 'acknowledged_at', 'acknowledgment_notes',
        'is_resolved', 'resolved_at', 'resolved_by', 'resolution_notes',
        'auto_dismissed', 'dismissed_at',
    ];

    protected $casts = [
        'alert_data' => 'array',
        'expiry_date' => 'date',
        'threshold_value' => 'integer',
        'current_value' => 'integer',
        'days_to_expiry' => 'integer',
        'is_acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
        'auto_dismissed' => 'boolean',
        'dismissed_at' => 'datetime',
    ];

    public function drug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_id');
    }

    public function batch()
    {
        return $this->belongsTo(PharmacyDrugBatch::class, 'batch_id');
    }

    public function acknowledgedByStaff()
    {
        return $this->belongsTo(Staff::class, 'acknowledged_by');
    }

    public function resolvedByStaff()
    {
        return $this->belongsTo(Staff::class, 'resolved_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_resolved', false);
    }

    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    public function scopeUnacknowledged($query)
    {
        return $query->where('is_acknowledged', false)
            ->where('is_resolved', false);
    }

    public function acknowledge($staffId, $notes = null)
    {
        $this->update([
            'is_acknowledged' => true,
            'acknowledged_by' => $staffId,
            'acknowledged_at' => now(),
            'acknowledgment_notes' => $notes,
        ]);
    }

    public function resolve($staffId, $notes = null)
    {
        $this->update([
            'is_resolved' => true,
            'resolved_by' => $staffId,
            'resolved_at' => now(),
            'resolution_notes' => $notes,
        ]);
    }
}
