<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prescription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'treatment_id',
        'doctor_id',
        'total_amount',
        'notes',
        'pharmacy_status',
        'sent_to_pharmacy_at',
        'reviewed_by_pharmacist_id',
        'reviewed_at',
        'pharmacist_notes',
        'is_manual_dispensation',
        'registered_on_the_fly',
        'dispensed_at',
        'dispensed_by_staff_id',
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
        return $this->hasMany(PrescriptionItem::class);
    }
}