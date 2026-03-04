<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class PharmacyDrugBatch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'drug_id', 'batch_number', 'supplier_id', 'purchase_order_number',
        'manufacture_date', 'expiry_date', 'quantity_received', 'quantity_current',
        'quantity_reserved', 'quantity_dispensed', 'quantity_damaged',
        'quantity_expired', 'quantity_returned', 'unit_cost', 'unit_price',
        'vat_percentage', 'markup_percentage', 'storage_location',
        'storage_temp_min', 'storage_temp_max', 'requires_cold_chain',
        'quality_check_status', 'quality_check_notes', 'quality_checked_at',
        'quality_checked_by', 'status', 'status_notes', 'received_date',
        'received_by', 'receiving_notes', 'expiry_alert_days',
        'expiry_alert_sent', 'notes',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date' => 'date',
        'received_date' => 'datetime',
        'quality_checked_at' => 'datetime',
        'quantity_received' => 'integer',
        'quantity_current' => 'integer',
        'quantity_reserved' => 'integer',
        'quantity_dispensed' => 'integer',
        'quantity_damaged' => 'integer',
        'quantity_expired' => 'integer',
        'quantity_returned' => 'integer',
        'unit_cost' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'vat_percentage' => 'decimal:2',
        'markup_percentage' => 'decimal:2',
        'storage_temp_min' => 'decimal:2',
        'storage_temp_max' => 'decimal:2',
        'requires_cold_chain' => 'boolean',
        'expiry_alert_sent' => 'boolean',
        'expiry_alert_days' => 'integer',
    ];

    // Relationships
    public function drug()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receivedByStaff()
    {
        return $this->belongsTo(Staff::class, 'received_by');
    }

    public function qualityCheckedByStaff()
    {
        return $this->belongsTo(Staff::class, 'quality_checked_by');
    }

    public function transactions()
    {
        return $this->hasMany(PharmacyInventoryTransaction::class, 'batch_id');
    }

    public function dispensationItems()
    {
        return $this->hasMany(PharmacyDispensationItem::class, 'batch_id');
    }

    public function alerts()
    {
        return $this->hasMany(PharmacyStockAlert::class, 'batch_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now())
            ->orWhere('status', 'expired');
    }

    public function scopeExpiringSoon($query, $days = 180)
    {
        return $query->where('status', 'active')
            ->whereBetween('expiry_date', [now(), now()->addDays($days)]);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'active')
            ->where('quantity_current', '>', 0)
            ->where('expiry_date', '>', now());
    }

    public function scopeForDrug($query, $drugId)
    {
        return $query->where('drug_id', $drugId);
    }

    public function scopeByLocation($query, $location)
    {
        return $query->where('storage_location', $location);
    }

    public function scopeFEFO($query)
    {
        return $query->where('status', 'active')
            ->where('quantity_current', '>', 0)
            ->where('expiry_date', '>', now())
            ->orderBy('expiry_date', 'asc');
    }

    // Accessors
    public function getAvailableQuantityAttribute()
    {
        return max(0, $this->quantity_current - $this->quantity_reserved);
    }

    public function getDaysToExpiryAttribute()
    {
        if (!$this->expiry_date) return null;
        return now()->diffInDays($this->expiry_date, false);
    }

    public function getIsExpiredAttribute()
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function getIsExpiringSoonAttribute()
    {
        return $this->days_to_expiry !== null && 
               $this->days_to_expiry <= $this->expiry_alert_days &&
               $this->days_to_expiry > 0;
    }

    public function getProfitMarginAttribute()
    {
        if (!$this->unit_cost) return 0;
        return ($this->unit_price - $this->unit_cost) / $this->unit_cost * 100;
    }

    public function getTotalCostAttribute()
    {
        return $this->quantity_current * $this->unit_cost;
    }

    public function getTotalValueAttribute()
    {
        return $this->quantity_current * $this->unit_price;
    }

    // Helper Methods
    public function deductQuantity(int $quantity, string $reason = null)
    {
        if ($quantity > $this->available_quantity) {
            throw new \Exception("Insufficient stock. Available: {$this->available_quantity}, Requested: {$quantity}");
        }

        $balanceBefore = $this->quantity_current;
        $this->quantity_current -= $quantity;
        $this->quantity_dispensed += $quantity;

        if ($this->quantity_current == 0) {
            $this->status = 'depleted';
        }

        $this->save();

        return $balanceBefore;
    }

    public function reserveQuantity(int $quantity)
    {
        if ($quantity > $this->available_quantity) {
            throw new \Exception("Insufficient stock to reserve");
        }

        $this->quantity_reserved += $quantity;
        $this->save();
    }

    public function releaseReservedQuantity(int $quantity)
    {
        $this->quantity_reserved = max(0, $this->quantity_reserved - $quantity);
        $this->save();
    }

    public function checkAndUpdateExpiryStatus()
    {
        if ($this->is_expired && $this->status === 'active') {
            $this->status = 'expired';
            $this->quantity_expired = $this->quantity_current;
            $this->quantity_current = 0;
            $this->save();
            
            // Create alert
            PharmacyStockAlert::create([
                'alert_type' => 'expired',
                'severity' => 'critical',
                'drug_id' => $this->drug_id,
                'batch_id' => $this->id,
                'message' => "Batch {$this->batch_number} has expired",
                'expiry_date' => $this->expiry_date,
                'days_to_expiry' => 0,
            ]);
        }
    }
}
