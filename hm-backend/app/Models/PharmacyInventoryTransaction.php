<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyInventoryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_number', 'batch_id', 'drug_id', 'transaction_type',
        'quantity', 'balance_before', 'balance_after', 'reference_type',
        'reference_id', 'from_location', 'to_location', 'reason', 'notes',
        'performed_by', 'authorized_by', 'transaction_date',
        'requires_authorization', 'is_authorized', 'unit_cost', 'total_value',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'quantity' => 'integer',
        'balance_before' => 'integer',
        'balance_after' => 'integer',
        'requires_authorization' => 'boolean',
        'is_authorized' => 'boolean',
        'unit_cost' => 'decimal:2',
        'total_value' => 'decimal:2',
        'reference_id' => 'integer',
    ];

    public function batch()
    {
        return $this->belongsTo(PharmacyDrugBatch::class, 'batch_id');
    }

    public function drug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_id');
    }

    public function performedByStaff()
    {
        return $this->belongsTo(Staff::class, 'performed_by');
    }

    public function authorizedByStaff()
    {
        return $this->belongsTo(Staff::class, 'authorized_by');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('transaction_type', $type);
    }

    public static function generateTransactionNumber()
    {
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return "TXN-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
