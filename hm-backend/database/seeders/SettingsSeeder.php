<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Setting::setSetting(
            'consultation_fee',
            3.00,
            'number',
            'Default consultation fee for patient visits'
        );
    }
}
