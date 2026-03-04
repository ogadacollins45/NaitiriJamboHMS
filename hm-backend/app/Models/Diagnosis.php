<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diagnosis extends Model
{
    protected $fillable = [
        'treatment_id',
        'diagnosis',
        'diagnosis_category',
        'diagnosis_subcategory',
        'is_primary',
    ];

    /**
     * Get the treatment that owns the diagnosis
     */
    public function treatment()
    {
        return $this->belongsTo(Treatment::class);
    }
}
