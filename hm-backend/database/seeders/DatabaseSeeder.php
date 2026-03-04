<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            DoctorSeeder::class,
            PatientSeeder::class,
            TreatmentSeeder::class,
            AppointmentSeeder::class,
            InventorySeeder::class,
            SettingsSeeder::class,
            LabTestsSeeder::class,
        ]);
    }
}
