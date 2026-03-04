<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'description'];

    /**
     * Get a setting value by key with optional default
     */
    public static function getSetting(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        // Cast value based on type
        return match($setting->type) {
            'number' => (float) $setting->value,
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    /**
     * Set/update a setting value
     */
    public static function setSetting(string $key, $value, string $type = 'string', ?string $description = null)
    {
        // Convert value to string for storage
        $stringValue = match($type) {
            'number' => (string) $value,
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => (string) $value,
        };

        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $stringValue,
                'type' => $type,
                'description' => $description,
            ]
        );
    }
}
