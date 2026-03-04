<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; // ✅ Important change
use Laravel\Sanctum\HasApiTokens; // ✅ Token authentication
use Illuminate\Notifications\Notifiable;

class Staff extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'ch_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected static function booted()
    {
        static::creating(function ($staff) {
            if (empty($staff->ch_id)) {
                $staff->ch_id = 'CH-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function documents()
    {
        return $this->hasMany(StaffDocument::class);
    }
}
