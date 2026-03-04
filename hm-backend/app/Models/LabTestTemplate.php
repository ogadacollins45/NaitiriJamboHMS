<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabTestTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'code',
        'description',
        'sample_type',
        'sample_volume',
        'container_type',
        'preparation_instructions',
        'turn_around_time',
        'price',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'turn_around_time' => 'integer',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(LabTestCategory::class, 'category_id');
    }

    public function parameters()
    {
        return $this->hasMany(LabTestParameter::class, 'test_template_id')->orderBy('sort_order');
    }

    public function requests()
    {
        return $this->hasMany(LabRequestTest::class, 'test_template_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }
}
