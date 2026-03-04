<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Admission extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'ward',
        'bed',
        'admission_type',
        'payment_type',
        'reason',
        'status',
        'admitted_at',
        'discharged_at',
        'discharge_note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'admitted_at'   => 'datetime',
        'discharged_at' => 'datetime',
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

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function entries()
    {
        return $this->hasMany(AdmissionEntry::class)->orderByDesc('recorded_at');
    }

    public function bill()
    {
        return $this->hasOne(Bill::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getDoctorNameAttribute(): ?string
    {
        if ($this->doctor) {
            return 'Dr. ' . $this->doctor->first_name . ' ' . $this->doctor->last_name;
        }
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Booted - Auto-set created_by / updated_by
    |--------------------------------------------------------------------------
    */

    protected static function booted()
    {
        static::creating(function ($admission) {
            if (empty($admission->admitted_at)) {
                $admission->admitted_at = now();
            }
            if (auth()->check()) {
                $admission->created_by = auth()->id();
            }
        });

        static::updating(function ($admission) {
            if (auth()->check()) {
                $admission->updated_by = auth()->id();
            }
        });
    }
}
