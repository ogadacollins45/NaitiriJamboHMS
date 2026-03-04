<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\KenyaLocation;

class KenyaLocationsSeeder extends Seeder
{
    public function run()
    {
        $locations = [
            // Bungoma County Sub-counties
            ['county' => 'Bungoma', 'sub_county' => 'Bumula', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Kabuchai', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Kanduyi', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Kimilili', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Mt. Elgon', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Sirisia', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Tongaren', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Webuye East', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Webuye West', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Bungoma South', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Bungoma North', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Bungoma Central', 'ward' => null],
            ['county' => 'Bungoma', 'sub_county' => 'Bungoma East', 'ward' => null],
            
            // Add other major counties for reference
            ['county' => 'Nairobi', 'sub_county' => 'Westlands', 'ward' => null],
            ['county' => 'Nairobi', 'sub_county' => 'Dagoretti North', 'ward' => null],
            ['county' => 'Nairobi', 'sub_county' => 'Langata', 'ward' => null],
            ['county' => 'Nairobi', 'sub_county' => 'Kibra', 'ward' => null],
            
            ['county' => 'Mombasa', 'sub_county' => 'Changamwe', 'ward' => null],
            ['county' => 'Mombasa', 'sub_county' => 'Jomvu', 'ward' => null],
            ['county' => 'Mombasa', 'sub_county' => 'Kisauni', 'ward' => null],
            
            ['county' => 'Kisumu', 'sub_county' => 'Kisumu Central', 'ward' => null],
            ['county' => 'Kisumu', 'sub_county' => 'Kisumu East', 'ward' => null],
            ['county' => 'Kisumu', 'sub_county' => 'Kisumu West', 'ward' => null],
            
            // Add more as needed
        ];

        foreach ($locations as $location) {
            KenyaLocation::create($location);
        }
    }
}
