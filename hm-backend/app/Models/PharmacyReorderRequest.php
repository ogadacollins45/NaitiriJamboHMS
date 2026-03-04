<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyReorderRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_drug_id',
        'quantity',
        'status',
        'notes',
        'requested_by'
    ];

    public function pharmacyDrug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'pharmacy_drug_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'requested_by');
    }
}
