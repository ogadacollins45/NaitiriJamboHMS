<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmissionEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_id',
        'user_id',
        'bp',
        'pulse',
        'temp',
        'spo2',
        'note',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function admission()
    {
        return $this->belongsTo(Admission::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Booted
    |--------------------------------------------------------------------------
    */

    protected static function booted()
    {
        static::creating(function ($entry) {
            if (empty($entry->recorded_at)) {
                $entry->recorded_at = now();
            }
            // Only assign user_id when the auth user actually exists in `users`
            // (Super Admin uses id=999999 which has no `users` row).
            if (empty($entry->user_id) && auth()->check()) {
                $authId = auth()->id();
                if (\Illuminate\Support\Facades\DB::table('users')->where('id', $authId)->exists()) {
                    $entry->user_id = $authId;
                }
            }
        });
    }
}
