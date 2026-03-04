<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'category',
        'description',
        'prescription_id',
        'prescription_item_id',
        'inventory_item_id',
        'pharmacy_dispensation_id',
        'pharmacy_dispensation_item_id',
        'lab_request_id',
        'lab_test_id',
        'quantity',
        'amount',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'amount' => 'float',
        'subtotal' => 'float',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }
}
