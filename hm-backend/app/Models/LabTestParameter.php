<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabTestParameter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'test_template_id',
        'name',
        'code',
        'result_type',
        'unit',
        'normal_range_min',
        'normal_range_max',
        'critical_low',
        'critical_high',
        'decimal_places',
        'sort_order',
    ];

    protected $casts = [
        'normal_range_min' => 'decimal:3',
        'normal_range_max' => 'decimal:3',
        'critical_low' => 'decimal:3',
        'critical_high' => 'decimal:3',
        'decimal_places' => 'integer',
        'sort_order' => 'integer',
    ];

    // Relationships
    public function template()
    {
        return $this->belongsTo(LabTestTemplate::class, 'test_template_id');
    }

    public function resultParameters()
    {
        return $this->hasMany(LabResultParameter::class, 'parameter_id');
    }

    // Helper method to check if value is abnormal
    public function isAbnormal($value)
    {
        $numericValue = floatval($value);
        
        if ($this->normal_range_min !== null && $numericValue < $this->normal_range_min) {
            return true;
        }
        
        if ($this->normal_range_max !== null && $numericValue > $this->normal_range_max) {
            return true;
        }
        
        return false;
    }

    // Get abnormal flag
    public function getAbnormalFlag($value)
    {
        $numericValue = floatval($value);
        
        if ($this->critical_low !== null && $numericValue <= $this->critical_low) {
            return 'LL'; // Critical Low
        }
        
        if ($this->critical_high !== null && $numericValue >= $this->critical_high) {
            return 'HH'; // Critical High
        }
        
        if ($this->normal_range_min !== null && $numericValue < $this->normal_range_min) {
            return 'L'; // Low
        }
        
        if ($this->normal_range_max !== null && $numericValue > $this->normal_range_max) {
            return 'H'; // High
        }
        
        return '';
    }

    // Get reference range string
    public function getReferenceRange()
    {
        if ($this->normal_range_min !== null && $this->normal_range_max !== null) {
            return "{$this->normal_range_min} - {$this->normal_range_max} {$this->unit}";
        }
        
        if ($this->normal_range_min !== null) {
            return "> {$this->normal_range_min} {$this->unit}";
        }
        
        if ($this->normal_range_max !== null) {
            return "< {$this->normal_range_max} {$this->unit}";
        }
        
        return '';
    }
}
