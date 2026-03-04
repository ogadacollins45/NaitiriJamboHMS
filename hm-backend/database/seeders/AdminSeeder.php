<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Staff;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Staff::updateOrCreate(
            ['email' => 'admin@hospital.com'],
            [
                'first_name' => 'System',
                'last_name' => 'Admin',
                'role' => 'admin',
                'phone' => '0700000000',
                'password' => Hash::make('admin123'), // ✅ default password
            ]
        );
    }
}
