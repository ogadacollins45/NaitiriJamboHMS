<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PharmacyDrug extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id',
        'drug_code',
        'generic_name',
        'brand_names',
        'dosage_form',
        'strength',
        'route_of_administration',
        'drug_category',
        'therapeutic_class',
        'controlled_substance',
        'schedule',
        'requires_prescription',
        'storage_conditions',
        'storage_temp_min',
        'storage_temp_max',
        'indications',
        'contraindications',
        'side_effects',
        'drug_interactions',
        'warnings',
        'precautions',
        'pregnancy_category',
        'safe_in_pregnancy',
        'safe_in_lactation',
        'pediatric_use',
        'geriatric_considerations',
        'renal_dosing',
        'hepatic_dosing',
        'manufacturer',
        'active_ingredient',
        'inactive_ingredients',
        'unit_of_measure',
        'default_unit_price',
        'current_stock',
        'reorder_level',
        'reorder_quantity',
        'is_active',
        'deactivation_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'brand_names' => 'array',
        'drug_interactions' => 'array',
        'storage_temp_min' => 'decimal:2',
        'storage_temp_max' => 'decimal:2',
        'default_unit_price' => 'decimal:2',
        'controlled_substance' => 'boolean',
        'requires_prescription' => 'boolean',
        'safe_in_pregnancy' => 'boolean',
        'safe_in_lactation' => 'boolean',
        'pediatric_use' => 'boolean',
        'is_active' => 'boolean',
        'reorder_level' => 'integer',
        'reorder_quantity' => 'integer',
    ];

    // Relationships
    public function batches()
    {
        return $this->hasMany(PharmacyDrugBatch::class, 'drug_id');
    }

    public function activeBatches()
    {
        return $this->hasMany(PharmacyDrugBatch::class, 'drug_id')
            ->where('status', 'active')
            ->where('quantity_current', '>', 0);
    }

    public function prescriptionItems()
    {
        return $this->hasMany(PharmacyPrescriptionItem::class, 'drug_id');
    }

    public function dispensationItems()
    {
        return $this->hasMany(PharmacyDispensationItem::class, 'drug_id');
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(PharmacyInventoryTransaction::class, 'drug_id');
    }

    public function interactions()
    {
        return $this->hasMany(PharmacyDrugInteraction::class, 'drug_a_id')
            ->orWhere('drug_b_id', $this->id);
    }

    public function stockAlerts()
    {
        return $this->hasMany(PharmacyStockAlert::class, 'drug_id');
    }

    public function creator()
    {
        return $this->belongsTo(Staff::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(Staff::class, 'updated_by');
    }

    public function inventoryItem()
    {
        return $this->hasOne(InventoryItem::class, 'pharmacy_drug_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeControlledSubstances($query)
    {
        return $query->where('controlled_substance', true);
    }

    public function scopeRequiresPrescription($query)
    {
        return $query->where('requires_prescription', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('drug_category', $category);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'reorder_level');
    }

    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('generic_name', 'like', "%{$term}%")
              ->orWhere('drug_code', 'like', "%{$term}%")
              ->orWhereJsonContains('brand_names', $term);
        });
    }

    // Accessors & Mutators
    public function getTotalStockAttribute()
    {
        return $this->batches()
            ->where('status', 'active')
            ->sum('quantity_current');
    }

    public function getAvailableStockAttribute()
    {
        return $this->batches()
            ->where('status', 'active')
            ->sum('quantity_current') - 
            $this->batches()->sum('quantity_reserved');
    }

    public function getIsLowStockAttribute()
    {
        return $this->total_stock <= $this->reorder_level;
    }

    public function getHasActiveInteractionsAttribute()
    {
        return $this->interactions()->where('is_active', true)->exists();
    }

    // Helper Methods
    public function checkInteractionWith($drugId, $severity = null)
    {
        $query = PharmacyDrugInteraction::where(function ($q) use ($drugId) {
            $q->where(function ($sq) use ($drugId) {
                $sq->where('drug_a_id', $this->id)
                   ->where('drug_b_id', $drugId);
            })->orWhere(function ($sq) use ($drugId) {
                $sq->where('drug_a_id', $drugId)
                   ->where('drug_b_id', $this->id);
            });
        })->where('is_active', true);

        if ($severity) {
            $query->where('interaction_severity', $severity);
        }

        return $query->first();
    }

    public function generateDrugCode()
    {
        $lastDrug = static::withTrashed()->latest('id')->first();
        $nextId = $lastDrug ? $lastDrug->id + 1 : 1;
        return 'DRG-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }
}
