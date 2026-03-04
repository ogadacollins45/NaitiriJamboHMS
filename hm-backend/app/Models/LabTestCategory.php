<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabTestCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function templates()
    {
        return $this->hasMany(LabTestTemplate::class, 'category_id');
    }

    public function activeTemplates()
    {
        return $this->hasMany(LabTestTemplate::class, 'category_id')
            ->where('is_active', true);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
