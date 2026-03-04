<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PharmacyPrescriptionItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'prescription_id', 'drug_id', 'quantity_prescribed', 'quantity_dispensed',
        'dosage', 'frequency', 'route', 'duration_days', 'duration_text',
        'special_instructions', 'administration_instructions',
        'substitute_allowed', 'alternative_drugs', 'status',
        'unit_price', 'line_total', 'first_dispensed_at', 'fully_dispensed_at',
    ];

    protected $casts = [
        'alternative_drugs' => 'array',
        'quantity_prescribed' => 'integer',
        'quantity_dispensed' => 'integer',
        'duration_days' => 'integer',
        'substitute_allowed' => 'boolean',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'first_dispensed_at' => 'datetime',
        'fully_dispensed_at' => 'datetime',
    ];

    public function prescription()
    {
        return $this->belongsTo(PharmacyPrescription::class, 'prescription_id');
    }

    public function drug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_id');
    }

    public function dispensationItems()
    {
        return $this->hasMany(PharmacyDispensationItem::class, 'prescription_item_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFullyDispensed($query)
    {
        return $query->where('status', 'fully_dispensed');
    }

    public function getQuantityRemainingAttribute()
    {
        return max(0, $this->quantity_prescribed - $this->quantity_dispensed);
    }
}
