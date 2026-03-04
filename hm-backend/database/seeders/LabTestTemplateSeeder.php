<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LabTestTemplate;
use App\Models\LabTestParameter;
use App\Models\LabTestCategory;
use Illuminate\Support\Facades\DB;

class LabTestTemplateSeeder extends Seeder
{
    public function run()
    {
        // Get or create categories
        $hematology = LabTestCategory::firstOrCreate(
            ['code' => 'HEM'],
            ['name' => 'Hematology', 'description' => 'Blood tests']
        );
        $biochemistry = LabTestCategory::firstOrCreate(
            ['code' => 'BIO'],
            ['name' => 'Biochemistry', 'description' => 'Chemical analysis']
        );

        DB::transaction(function () use ($hematology, $biochemistry) {
            // 1. Complete Blood Count (CBC)
            $cbc = LabTestTemplate::create([
                'category_id' => $hematology->id,
                'name' => 'Complete Blood Count (CBC)',
                'code' => 'CBC001',
                'description' => 'Comprehensive blood cell analysis',
                'sample_type' => 'blood',
                'sample_volume' => '3-5 ml',
                'container_type' => 'Purple top (EDTA)',
                'turn_around_time' => 24,
                'price' => 800.00,
                'is_active' => true,
            ]);

            $cbcParams = [
                ['name' => 'WBC', 'code' => 'WBC', 'unit' => '×10³/µL', 'normal_range_min' => 4.0, 'normal_range_max' => 11.0, 'sort_order' => 10],
                ['name' => 'RBC', 'code' => 'RBC', 'unit' => '×10⁶/µL', 'normal_range_min' => 4.5, 'normal_range_max' => 5.5, 'sort_order' => 20],
                ['name' => 'Hemoglobin', 'code' => 'HGB', 'unit' => 'g/dL', 'normal_range_min' => 12.0, 'normal_range_max' => 16.0, 'sort_order' => 30],
                ['name' => 'Platelets', 'code' => 'PLT', 'unit' => '×10³/µL', 'normal_range_min' => 150.0, 'normal_range_max' => 400.0, 'sort_order' => 40],
            ];

            foreach ($cbcParams as $param) {
                LabTestParameter::create(array_merge($param, ['test_template_id' => $cbc->id]));
            }

            // 2. Lipid Panel
            $lipid = LabTestTemplate::create([
                'category_id' => $biochemistry->id,
                'name' => 'Lipid Panel',
                'code' => 'LIP001',
                'description' => 'Cholesterol and triglycerides analysis',
                'sample_type' => 'blood',
                'sample_volume' => '3 ml',
                'container_type' => 'Red top',
                'preparation_instructions' => 'Fasting for 12-14 hours required',
                'turn_around_time' => 24,
                'price' => 1200.00,
                'is_active' => true,
            ]);

            $lipidParams = [
                ['name' => 'Total Cholesterol', 'code' => 'CHOL', 'unit' => 'mg/dL', 'normal_range_min' => 0, 'normal_range_max' => 200, 'sort_order' => 10],
                ['name' => 'HDL Cholesterol', 'code' => 'HDL', 'unit' => 'mg/dL', 'normal_range_min' => 40, 'normal_range_max' => 60, 'sort_order' => 20],
                ['name' => 'LDL Cholesterol', 'code' => 'LDL', 'unit' => 'mg/dL', 'normal_range_min' => 0, 'normal_range_max' => 130, 'sort_order' => 30],
                ['name' => 'Triglycerides', 'code' => 'TRG', 'unit' => 'mg/dL', 'normal_range_min' => 0, 'normal_range_max' => 150, 'sort_order' => 40],
            ];

            foreach ($lipidParams as $param) {
                LabTestParameter::create(array_merge($param, ['test_template_id' => $lipid->id]));
            }

            // 3. Blood Glucose
            $glucose = LabTestTemplate::create([
                'category_id' => $biochemistry->id,
                'name' => 'Blood Glucose (Fasting)',
                'code' => 'GLU001',
                'description' => 'Fasting blood sugar measurement',
                'sample_type' => 'blood',
                'sample_volume' => '2 ml',
                'container_type' => 'Gray top',
                'preparation_instructions' => 'Fasting for 8-12 hours required',
                'turn_around_time' => 12,
                'price' => 300.00,
                'is_active' => true,
            ]);

            LabTestParameter::create([
                'test_template_id' => $glucose->id,
                'name' => 'Fasting Blood Sugar',
                'code' => 'FBS',
                'unit' => 'mg/dL',
                'normal_range_min' => 70,
                'normal_range_max' => 100,
                'sort_order' => 10,
            ]);
        });
    }
}
