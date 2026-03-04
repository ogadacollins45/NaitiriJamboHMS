<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Triage extends Model
{
    protected $fillable = [
        'patient_id',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'temperature',
        'pulse_rate',
        'respiratory_rate',
        'weight',
        'height',
        'oxygen_saturation',
        'chief_complaint',
        'notes',
        'recorded_by',
    ];

    /**
     * Get the patient that owns this triage record
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the staff member who recorded this triage
     */
    public function recorder()
    {
        return $this->belongsTo(Staff::class, 'recorded_by');
    }
}
