<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabRequestTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_request_id',
        'test_template_id',
        'status',
        'priority',
        'notes',
    ];

    // Relationships
    public function labRequest()
    {
        return $this->belongsTo(LabRequest::class, 'lab_request_id');
    }

    public function template()
    {
        return $this->belongsTo(LabTestTemplate::class, 'test_template_id');
    }

    public function result()
    {
        return $this->hasOne(LabResult::class, 'lab_request_test_id');
    }
}
