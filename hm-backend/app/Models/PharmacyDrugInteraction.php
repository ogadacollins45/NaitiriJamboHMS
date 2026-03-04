<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyDrugInteraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'drug_a_id', 'drug_b_id', 'interaction_severity',
        'interaction_description', 'clinical_effect', 'mechanism',
        'management_recommendation', 'monitoring_parameters',
        'evidence_level', 'references', 'source', 'is_active',
        'reviewed_at', 'reviewed_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function drugA()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_a_id');
    }

    public function drugB()
    {
        return $this->belongsTo(PharmacyDrug::class, 'drug_b_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(Staff::class, 'reviewed_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeMajor($query)
    {
        return $query->whereIn('interaction_severity', ['major', 'contraindicated']);
    }

    public function scopeForDrug($query, $drugId)
    {
        return $query->where('drug_a_id', $drugId)
            ->orWhere('drug_b_id', $drugId);
    }
}
