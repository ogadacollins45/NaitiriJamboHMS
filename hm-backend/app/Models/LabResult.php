<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_request_test_id',
        'lab_request_id',
        'test_template_id',
        'performed_by',
        'verified_by',
        'performed_at',
        'verified_at',
        'status',
        'overall_comment',
        'quality_control_passed',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'verified_at' => 'datetime',
        'quality_control_passed' => 'boolean',
    ];

    // Relationships
    public function labRequest()
    {
        return $this->belongsTo(LabRequest::class, 'lab_request_id');
    }

    public function labRequestTest()
    {
        return $this->belongsTo(LabRequestTest::class, 'lab_request_test_id');
    }

    public function template()
    {
        return $this->belongsTo(LabTestTemplate::class, 'test_template_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(Staff::class, 'performed_by');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(Staff::class, 'verified_by');
    }

    public function parameters()
    {
        return $this->hasMany(LabResultParameter::class, 'lab_result_id');
    }

    // Check if any parameter is abnormal
    public function hasAbnormalValues()
    {
        return $this->parameters()->where('is_abnormal', true)->exists();
    }
}
