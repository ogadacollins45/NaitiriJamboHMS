<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FacilityProfile;

class FacilityProfileSeeder extends Seeder
{
    public function run()
    {
        FacilityProfile::create([
            'facility_name' => 'Brixton Health Centre',
            'moh_code' => 'MOH-12345',
            'keph_level' => '3', // Update if different: 2, 3, 4, 5, or 6
            'county' => 'Bungoma',
            'sub_county' => 'Bungoma South',
            'ward' => '', // Add your ward name
            'physical_address' => '', // Add your physical address
            'ownership' => 'private', // or 'public', 'faith_based', 'ngo'
            'services_offered' => json_encode([
                'OPD',
                'MCH',
                'Delivery',
                'Immunisation',
                'Lab',
                'Pharmacy',
                'Inpatient',
                'HIV/TB Clinic'
            ]),
            'phone' => '', // Add facility phone
            'email' => '', // Add facility email
            'facility_incharge' => '', // Add incharge name
            'incharge_phone' => '', // Add incharge phone
            'is_active' => true
        ]);
    }
}
