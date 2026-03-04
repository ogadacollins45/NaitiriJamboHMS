<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id','type','quantity','balance_after','reason','reference','performed_by'
    ];

    public function item() {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }
}
