<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id', 'item_code', 'name', 'category', 'subcategory', 'quantity', 'unit',
        'reorder_level', 'unit_price', 'supplier_id', 'pharmacy_drug_id', 'expiry_date', 'batch_no', 'location',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'unit_price'  => 'decimal:2',
    ];

    protected $appends = ['total_value', 'low_stock'];

    public function supplier() {
        return $this->belongsTo(Supplier::class);
    }

    public function transactions() {
        return $this->hasMany(InventoryTransaction::class, 'item_id');
    }

    public function pharmacyDrug() {
        return $this->belongsTo(PharmacyDrug::class, 'pharmacy_drug_id');
    }

    // Scopes
    public function scopeMedicines($query) {
        return $query->where('category', 'Medicine');
    }

    public function scopeUnlinked($query) {
        return $query->where('category', 'Medicine')->whereNull('pharmacy_drug_id');
    }

    public function getTotalValueAttribute() {
        return (float) $this->unit_price * (int) $this->quantity;
    }

    public function getLowStockAttribute() {
        return $this->reorder_level > 0 && $this->quantity <= $this->reorder_level;
    }
}