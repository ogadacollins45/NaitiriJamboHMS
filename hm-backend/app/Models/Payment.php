<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'amount_paid',
        'payment_method',
        'transaction_ref',
        'notes',
        'paid_at',
    ];

    protected $casts = [
        'amount_paid' => 'float',
        'paid_at' => 'datetime',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }
}
