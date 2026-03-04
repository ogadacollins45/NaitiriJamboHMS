<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyDispensationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'dispensation_id', 'prescription_item_id', 'drug_id', 'batch_id',
        'quantity_dispensed', 'unit_price', 'unit_cost', 'line_total',
        'profit_margin', 'discount_amount', 'vat_amount', 'expiry_date',
        'batch_number', 'storage_location', 'dosage_given',
        'instructions_given', 'warnings_given', 'was_substituted',
        'original_drug_id', 'substitution_reason',
    ];

    protected $casts = [
        'quantity_dispensed' => 'integer',
        'unit_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'line_total' => 'decimal:2',
        'profit_margin' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'expiry_date' => 'date',
        'was_substituted' => 'boolean',
    ];

    public function dispensation()
    {
        return $this->belongsTo(PharmacyDispensation::class, 'dispensation_id');
    }

    public function prescriptionItem()
    {
        return $this->belongsTo(PharmacyPrescriptionItem::class, 'prescription_item_id');
    }

    public function drug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_id');
    }

    public function batch()
    {
        return $this->belongsTo(PharmacyDrugBatch::class, 'batch_id');
    }

    public function originalDrug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'original_drug_id');
    }
}
