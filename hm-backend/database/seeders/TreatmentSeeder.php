<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TreatmentSeeder extends Seeder
{
    public function run(): void
    {
        $patients = DB::table('patients')->pluck('id');
        $doctors = DB::table('doctors')->pluck('first_name', 'id');

        foreach ($patients as $patientId) {
            DB::table('treatments')->insert([
                [
                    'patient_id' => $patientId,
                    'visit_date' => now()->subDays(rand(5, 15)),
                    'diagnosis' => 'Common Cold',
                    'treatment_notes' => 'Prescribed rest and hydration.',
                    'attending_doctor' => 'Dr. ' . $doctors->random(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'patient_id' => $patientId,
                    'visit_date' => now()->subDays(rand(1, 5)),
                    'diagnosis' => 'Fever',
                    'treatment_notes' => 'Advised monitoring temperature.',
                    'attending_doctor' => 'Dr. ' . $doctors->random(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}
