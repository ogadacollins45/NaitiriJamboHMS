<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PrescriptionItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'prescription_id',
        'inventory_item_id',
        'quantity',
        'unit_price',
        'subtotal',
        'drug_name_text',
        'dosage_text',
        'frequency_text',
        'duration_text',
        'instructions_text',
        'mapped_drug_id',
        'mapped_quantity',
        'dispensed_from_stock',
        'source',
        'manually_added_by',
    ];

    protected $casts = [
        'quantity'   => 'integer',
        'unit_price' => 'float',
        'subtotal'   => 'float',
    ];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function mappedDrug()
    {
        return $this->belongsTo(\App\Models\PharmacyDrug::class, 'mapped_drug_id');
    }
}