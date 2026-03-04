<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'specialization',
        'phone',
        'email',
    ];

    // A doctor has many appointments
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    // Optional: link to treatments if you ever expand that logic
    public function treatments()
    {
        return $this->hasMany(Treatment::class, 'attending_doctor', 'id');
    }
}
