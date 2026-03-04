<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'patient_id',
        'doctor_id',
        'pharmacist_id',
        'status',
        'notes',
        'dispensed_at',
    ];

    protected $casts = [
        'dispensed_at' => 'datetime',
    ];

    // Relationships
    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function pharmacist()
    {
        return $this->belongsTo(Staff::class, 'pharmacist_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeDispensed($query)
    {
        return $query->where('status', 'dispensed');
    }
}
