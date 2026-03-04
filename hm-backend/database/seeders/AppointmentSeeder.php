<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $patients = DB::table('patients')->pluck('id');
        $doctors = DB::table('doctors')->pluck('id');

        foreach ($patients as $patientId) {
            DB::table('appointments')->insert([
                [
                    'patient_id' => $patientId,
                    'doctor_id' => $doctors->random(),
                    'appointment_time' => now()->addDays(rand(1, 7))->setTime(rand(9, 17), 0),
                    'status' => 'Scheduled',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}
