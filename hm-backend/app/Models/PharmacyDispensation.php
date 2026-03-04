<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PharmacyDispensation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'dispensation_number', 'prescription_id', 'patient_id',
        'dispensation_type', 'dispensed_at', 'dispensed_by_staff_id',
        'assigned_pharmacist_id', 'verified_by_pharmacist_id',
        'verification_status', 'verified_at', 'verification_notes',
        'patient_collected', 'collected_at', 'collection_method',
        'collected_by_name', 'collected_by_id_number', 'collected_by_relationship',
        'total_amount', 'amount_paid', 'payment_status',
        'patient_counseled', 'counseling_notes', 'patient_questions',
        'adverse_reactions_noted', 'requires_follow_up', 'follow_up_date',
        'follow_up_instructions', 'special_notes', 'internal_notes',
    ];

    protected $casts = [
        'dispensed_at' => 'datetime',
        'verified_at' => 'datetime',
        'collected_at' => 'datetime',
        'follow_up_date' => 'date',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'patient_collected' => 'boolean',
        'patient_counseled' => 'boolean',
        'requires_follow_up' => 'boolean',
    ];

    // Relationships
    public function prescription()
    {
        return $this->belongsTo(PharmacyPrescription::class, 'prescription_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dispensedByStaff()
    {
        return $this->belongsTo(Staff::class, 'dispensed_by_staff_id');
    }

    public function assignedPharmacist()
    {
        return $this->belongsTo(Staff::class, 'assigned_pharmacist_id');
    }

    public function verifiedByPharmacist()
    {
        return $this->belongsTo(Staff::class, 'verified_by_pharmacist_id');
    }

    public function items()
    {
        return $this->hasMany(PharmacyDispensationItem::class, 'dispensation_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('verification_status', 'pending');
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeUncollected($query)
    {
        return $query->where('patient_collected', false);
    }

    public function scopeUnpaid($query)
    {
        return $query->whereIn('payment_status', ['unpaid', 'partially_paid']);
    }

    public function scopeByPharmacist($query, $pharmacistId)
    {
        return $query->where('assigned_pharmacist_id', $pharmacistId);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('dispensed_at', today());
    }

    // Accessors
    public function getAmountOutstandingAttribute()
    {
        return max(0, $this->total_amount - $this->amount_paid);
    }

    public function getIsFullyPaidAttribute()
    {
        return $this->amount_outstanding <= 0;
    }

    // Helper Methods
    public function generateDispensationNumber()
    {
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return "DISP-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    public function markAsCollected($collectorName = null, $collectorId = null, $relationship = null)
    {
        $this->update([
            'patient_collected' => true,
            'collected_at' => now(),
            'collected_by_name' => $collectorName,
            'collected_by_id_number' => $collectorId,
            'collected_by_relationship' => $relationship,
        ]);
    }

    public function recordPayment($amount)
    {
        $this->amount_paid += $amount;
        
        if ($this->amount_paid >= $this->total_amount) {
            $this->payment_status = 'paid';
        } elseif ($this->amount_paid > 0) {
            $this->payment_status = 'partially_paid';
        }
        
        $this->save();
    }
}
