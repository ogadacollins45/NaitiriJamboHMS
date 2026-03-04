<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('patients')->insert([
            [
                'upid' => 'HMS-' . strtoupper(uniqid()),
                'first_name' => 'Samuel',
                'last_name' => 'Orwa',
                'gender' => 'M',
                'dob' => '2017-02-01',
                'phone' => '0543088033',
                'email' => 'samuel.orwa@example.com',
                'address' => 'Saudi Arabia, Dhahran',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'upid' => 'HMS-' . strtoupper(uniqid()),
                'first_name' => 'Mary',
                'last_name' => 'Achieng',
                'gender' => 'F',
                'dob' => '1990-07-21',
                'phone' => '0733333333',
                'email' => 'mary.achieng@example.com',
                'address' => 'Nairobi, Kenya',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
