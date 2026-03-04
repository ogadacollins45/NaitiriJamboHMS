<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResultParameter extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_result_id',
        'parameter_id',
        'value',
        'unit',
        'is_abnormal',
        'abnormal_flag',
        'reference_range',
        'comment',
    ];

    protected $casts = [
        'is_abnormal' => 'boolean',
    ];

    // Relationships
    public function labResult()
    {
        return $this->belongsTo(LabResult::class, 'lab_result_id');
    }

    public function parameter()
    {
        return $this->belongsTo(LabTestParameter::class, 'parameter_id');
    }
}
