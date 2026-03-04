<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PharmacyPrescription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'prescription_number', 'patient_id', 'treatment_id', 'doctor_id',
        'prescribing_date', 'diagnosis', 'prescription_type', 'priority',
        'valid_until', 'status', 'special_instructions', 'allergies_noted',
        'patient_warnings', 'total_estimated_cost', 'total_dispensed_cost',
        'notes', 'cancelled_at', 'cancelled_by', 'cancellation_reason',
    ];

    protected $casts = [
        'prescribing_date' => 'datetime',
        'valid_until' => 'date',
        'cancelled_at' => 'datetime',
        'total_estimated_cost' => 'decimal:2',
        'total_dispensed_cost' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function treatment()
    {
        return $this->belongsTo(Treatment::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function items()
    {
        return $this->hasMany(PharmacyPrescriptionItem::class, 'prescription_id');
    }

    public function dispensations()
    {
        return $this->hasMany(PharmacyDispensation::class, 'prescription_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['active', 'partially_dispensed']);
    }

    public function generatePrescriptionNumber()
    {
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return "RX-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
