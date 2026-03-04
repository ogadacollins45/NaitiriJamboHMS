<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('doctors')->insert([
            [
                'first_name' => 'James',
                'last_name' => 'Otieno',
                'specialization' => 'Cardiology',
                'phone' => '0700000000',
                'email' => 'j.otieno@example.com',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Mutua',
                'specialization' => 'Pediatrics',
                'phone' => '0711111111',
                'email' => 's.mutua@example.com',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Paul',
                'last_name' => 'Mwangi',
                'specialization' => 'General Medicine',
                'phone' => '0722222222',
                'email' => 'p.mwangi@example.com',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
