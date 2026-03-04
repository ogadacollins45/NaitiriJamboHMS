<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_time',
        'status',
    ];

    // Appointment belongs to a patient
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    // Appointment belongs to a doctor
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
