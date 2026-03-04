<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'bill_id', // NEW - link to consolidated bill
        'visit_date',
        'treatment_type', // NEW - 'new' or 'revisit'
        'diagnosis',
        'diagnosis_category',
        'diagnosis_subcategory',
        'diagnosis_status',
        'treatment_notes',
        'chief_complaint',
        'premedication',
        'past_medical_history',
        'systemic_review',
        'impression',
        'attending_doctor',
        'status',
        
        // NEW MOH fields (all nullable)
        'visit_type',
        'encounter_type',
        'department',
        'service_category',
        'service_subcategory',
        'treatment_category',
        'treatment_subcategory',
        'referral_status',
        'referred_from',
        'payment_type',
        'disposition',
        'referred_to_facility',
        'referral_reason',
        'death_datetime',
        'cause_of_death',
        'maternal_death',
        'neonatal_death',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'death_datetime' => 'datetime',
        'maternal_death' => 'boolean',
        'neonatal_death' => 'boolean',
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

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    // Lab requests for this treatment
    public function labRequests()
    {
        return $this->hasMany(LabRequest::class);
    }

    /**
     * Get the additional diagnoses for this treatment
     */
    public function diagnoses()
    {
        return $this->hasMany(Diagnosis::class);
    }

    // Pharmacy prescriptions for this treatment
    public function pharmacyPrescriptions()
    {
        return $this->hasMany(PharmacyPrescription::class);
    }

    // Link to the bill this treatment belongs to (many treatments can share one bill for same-day visits)
    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Helpers
    |--------------------------------------------------------------------------
    */

    public function getDoctorNameAttribute(): ?string
    {
        if ($this->doctor) {
            return 'Dr. ' . $this->doctor->first_name . ' ' . $this->doctor->last_name;
        }
        return $this->attending_doctor;
    }

    protected static function booted()
    {
        static::creating(function ($treatment) {
            if (empty($treatment->status)) {
                $treatment->status = 'active';
            }
            
            // Auto-set created_by
            if (auth()->check()) {
                $treatment->created_by = auth()->id();
            }
            
            // Auto-detect maternal/neonatal deaths ONLY if disposition is 'died'
            if ($treatment->disposition === 'died' && $treatment->patient) {
                $age = $treatment->patient->age;
                $gender = $treatment->patient->gender;
                
                // Maternal death: Female aged 15-49
                if ($gender === 'F' && $age >= 15 && $age <= 49) {
                    $treatment->maternal_death = true;
                }
                
                // Neonatal death: Age less than 28 days
                if ($age < 28/365) {
                    $treatment->neonatal_death = true;
                }
            }
        });

        static::updating(function ($treatment) {
            // Auto-set updated_by
            if (auth()->check()) {
                $treatment->updated_by = auth()->id();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MOH Helper Methods
    |--------------------------------------------------------------------------
    */

    // Get age group for MOH reporting
    public function getAgeGroup()
    {
        if (!$this->patient) return null;
        
        $age = $this->patient->age;
        if ($age < 1) return '<1';
        if ($age <= 4) return '1-4';
        if ($age <= 14) return '5-14';
        if ($age <= 49) return '15-49';
        return '50+';
    }

    // Check if patient is under 5
    public function isUnderFive()
    {
        return $this->patient && $this->patient->age < 5;
    }

    /**
     * Check if this is a same-day revisit
     */
    public function isDayRevisit(): bool
    {
        return $this->treatment_type === 'revisit';
    }

    /**
     * Get the first treatment for this patient on this day
     */
    public static function getFirstTreatmentOfDay(int $patientId, $visitDate): ?Treatment
    {
        return static::where('patient_id', $patientId)
            ->whereDate('visit_date', $visitDate)
            ->orderBy('created_at', 'asc')
            ->first();
    }

    /**
     * Check if patient has any treatments on this day already
     */
    public static function hasTreatmentOnDay(int $patientId, $visitDate): bool
    {
        return static::where('patient_id', $patientId)
            ->whereDate('visit_date', $visitDate)
            ->exists();
    }
}

