<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LabTestCategory;
use App\Models\LabTestTemplate;
use App\Models\LabTestParameter;

class LabTestsSeeder extends Seeder
{
    public function run(): void
    {
        // Create Categories (using firstOrCreate to prevent duplicates)
        $hematology = LabTestCategory::firstOrCreate(
            ['code' => 'HEM'],
            [
                'name' => 'Hematology',
                'description' => 'Blood-related tests',
                'is_active' => true,
            ]
        );

        $biochemistry = LabTestCategory::firstOrCreate(
            ['code' => 'BIO'],
            [
                'name' => 'Biochemistry',
                'description' => 'Biochemical analysis',
                'is_active' => true,
            ]
        );

        $microbiology = LabTestCategory::firstOrCreate(
            ['code' => 'MICRO'],
            [
                'name' => 'Microbiology',
                'description' => 'Microbiological analysis',
                'is_active' => true,
            ]
        );

        $serology = LabTestCategory::firstOrCreate(
            ['code' => 'SERO'],
            [
                'name' => 'Serology / Immunology',
                'description' => 'Immunological and serological tests',
                'is_active' => true,
            ]
        );

        $pathology = LabTestCategory::firstOrCreate(
            ['code' => 'PATH'],
            [
                'name' => 'Pathology',
                'description' => 'Tissue and cellular analysis',
                'is_active' => true,
            ]
        );

        $urinalysis = LabTestCategory::firstOrCreate(
            ['code' => 'URINE'],
            [
                'name' => 'Urinalysis',
                'description' => 'Urine tests',
                'is_active' => true,
            ]
        );

        $stoolAnalysis = LabTestCategory::firstOrCreate(
            ['code' => 'STOOL'],
            [
                'name' => 'Stool Analysis',
                'description' => 'Stool tests',
                'is_active' => true,
            ]
        );

        $endocrinology = LabTestCategory::firstOrCreate(
            ['code' => 'ENDO'],
            [
                'name' => 'Endocrinology',
                'description' => 'Hormone and endocrine tests',
                'is_active' => true,
            ]
        );

        $bloodBank = LabTestCategory::firstOrCreate(
            ['code' => 'BB'],
            [
                'name' => 'Blood Bank',
                'description' => 'Blood banking and transfusion tests',
                'is_active' => true,
            ]
        );

        $other = LabTestCategory::firstOrCreate(
            ['code' => 'OTHER'],
            [
                'name' => 'Other',
                'description' => 'Other laboratory tests',
                'is_active' => true,
            ]
        );

        // Complete Blood Count (CBC)
        $cbc = LabTestTemplate::create([
            'category_id' => $hematology->id,
            'name' => 'Complete Blood Count',
            'code' => 'CBC',
            'description' => 'Comprehensive blood cell analysis',
            'sample_type' => 'blood',
            'sample_volume' => '3ml',
            'container_type' => 'EDTA tube (purple top)',
            'turn_around_time' => 2,
            'price' => 500,
            'is_active' => true,
        ]);

        // CBC Parameters
        $cbcParams = [
            ['name' => 'WBC (White Blood Cells)', 'code' => 'WBC', 'unit' => '10³/μL', 'min' => 4.5, 'max' => 11.0, 'crit_low' => 2.0, 'crit_high' => 20.0, 'decimals' => 2, 'order' => 1],
            ['name' => 'RBC (Red Blood Cells)', 'code' => 'RBC', 'unit' => '10⁶/μL', 'min' => 4.5, 'max' => 5.5, 'crit_low' => 2.5, 'crit_high' => 7.0, 'decimals' => 2, 'order' => 2],
            ['name' => 'Hemoglobin', 'code' => 'HGB', 'unit' => 'g/dL', 'min' => 12.0, 'max' => 16.0, 'crit_low' => 7.0, 'crit_high' => 20.0, 'decimals' => 1, 'order' => 3],
            ['name' => 'Hematocrit', 'code' => 'HCT', 'unit' => '%', 'min' => 37, 'max' => 47, 'crit_low' => 20, 'crit_high' => 60, 'decimals' => 1, 'order' => 4],
            ['name' => 'Platelets', 'code' => 'PLT', 'unit' => '10³/μL', 'min' => 150, 'max' => 400, 'crit_low' => 50, 'crit_high' => 1000, 'decimals' => 0, 'order' => 5],
            ['name' => 'MCV (Mean Corpuscular Volume)', 'code' => 'MCV', 'unit' => 'fL', 'min' => 80, 'max' => 100, 'crit_low' => null, 'crit_high' => null, 'decimals' => 1, 'order' => 6],
        ];

        foreach ($cbcParams as $param) {
            LabTestParameter::create([
                'test_template_id' => $cbc->id,
                'name' => $param['name'],
                'code' => $param['code'],
                'unit' => $param['unit'],
                'normal_range_min' => $param['min'],
                'normal_range_max' => $param['max'],
                'critical_low' => $param['crit_low'],
                'critical_high' => $param['crit_high'],
                'decimal_places' => $param['decimals'],
                'sort_order' => $param['order'],
            ]);
        }

        // Lipid Panel
        $lipid = LabTestTemplate::create([
            'category_id' => $biochemistry->id,
            'name' => 'Lipid Panel',
            'code' => 'LIPID',
            'description' => 'Cholesterol and triglycerides',
            'sample_type' => 'blood',
            'sample_volume' => '5ml',
            'container_type' => 'SST tube (gold top)',
            'preparation_instructions' => 'Fasting for 12 hours required',
            'turn_around_time' => 4,
            'price' => 800,
            'is_active' => true,
        ]);

        $lipidParams = [
            ['name' => 'Total Cholesterol', 'code' => 'CHOL', 'unit' => 'mg/dL', 'min' => 0, 'max' => 200, 'crit_low' => null, 'crit_high' => 300, 'decimals' => 0, 'order' => 1],
            ['name' => 'HDL Cholesterol', 'code' => 'HDL', 'unit' => 'mg/dL', 'min' => 40, 'max' => 60, 'crit_low' => 20, 'crit_high' => null, 'decimals' => 0, 'order' => 2],
            ['name' => 'LDL Cholesterol', 'code' => 'LDL', 'unit' => 'mg/dL', 'min' => 0, 'max' => 100, 'crit_low' => null, 'crit_high' => 190, 'decimals' => 0, 'order' => 3],
            ['name' => 'Triglycerides', 'code' => 'TRIG', 'unit' => 'mg/dL', 'min' => 0, 'max' => 150, 'crit_low' => null, 'crit_high' => 500, 'decimals' => 0, 'order' => 4],
        ];

        foreach ($lipidParams as $param) {
            LabTestParameter::create([
                'test_template_id' => $lipid->id,
                'name' => $param['name'],
                'code' => $param['code'],
                'unit' => $param['unit'],
                'normal_range_min' => $param['min'],
                'normal_range_max' => $param['max'],
                'critical_low' => $param['crit_low'],
                'critical_high' => $param['crit_high'],
                'decimal_places' => $param['decimals'],
                'sort_order' => $param['order'],
            ]);
        }

        // Liver Function Tests (LFT)
        $lft = LabTestTemplate::create([
            'category_id' => $biochemistry->id,
            'name' => 'Liver Function Tests',
            'code' => 'LFT',
            'description' => 'Assess liver health',
            'sample_type' => 'blood',
            'sample_volume' => '5ml',
            'container_type' => 'SST tube (gold top)',
            'turn_around_time' => 6,
            'price' => 1000,
            'is_active' => true,
        ]);

        $lftParams = [
            ['name' => 'ALT (Alanine Aminotransferase)', 'code' => 'ALT', 'unit' => 'U/L', 'min' => 7, 'max' => 56, 'crit_low' => null, 'crit_high' => 300, 'decimals' => 0, 'order' => 1],
            ['name' => 'AST (Aspartate Aminotransferase)', 'code' => 'AST', 'unit' => 'U/L', 'min' => 10, 'max' => 40, 'crit_low' => null, 'crit_high' => 300, 'decimals' => 0, 'order' => 2],
            ['name' => 'ALP (Alkaline Phosphatase)', 'code' => 'ALP', 'unit' => 'U/L', 'min' => 44, 'max' => 147, 'crit_low' => null, 'crit_high' => 500, 'decimals' => 0, 'order' => 3],
            ['name' => 'Total Bilirubin', 'code' => 'TBIL', 'unit' => 'mg/dL', 'min' => 0.1, 'max' => 1.2, 'crit_low' => null, 'crit_high' => 10.0, 'decimals' => 2, 'order' => 4],
            ['name' => 'Albumin', 'code' => 'ALB', 'unit' => 'g/dL', 'min' => 3.5, 'max' => 5.5, 'crit_low' => 2.0, 'crit_high' => null, 'decimals' => 1, 'order' => 5],
        ];

        foreach ($lftParams as $param) {
            LabTestParameter::create([
                'test_template_id' => $lft->id,
                'name' => $param['name'],
                'code' => $param['code'],
                'unit' => $param['unit'],
                'normal_range_min' => $param['min'],
                'normal_range_max' => $param['max'],
                'critical_low' => $param['crit_low'],
                'critical_high' => $param['crit_high'],
                'decimal_places' => $param['decimals'],
                'sort_order' => $param['order'],
            ]);
        }

        // Kidney Function Tests (KFT)
        $kft = LabTestTemplate::create([
            'category_id' => $biochemistry->id,
            'name' => 'Kidney Function Tests',
            'code' => 'KFT',
            'description' => 'Assess kidney health',
            'sample_type' => 'blood',
            'sample_volume' => '5ml',
            'container_type' => 'SST tube (gold top)',
            'turn_around_time' => 6,
            'price' => 900,
            'is_active' => true,
        ]);

        $kftParams = [
            ['name' => 'Creatinine', 'code' => 'CREAT', 'unit' => 'mg/dL', 'min' => 0.6, 'max' => 1.2, 'crit_low' => null, 'crit_high' => 10.0, 'decimals' => 2, 'order' => 1],
            ['name' => 'Blood Urea Nitrogen (BUN)', 'code' => 'BUN', 'unit' => 'mg/dL', 'min' => 7, 'max' => 20, 'crit_low' => null, 'crit_high' => 100, 'decimals' => 0, 'order' => 2],
            ['name' => 'Sodium', 'code' => 'NA', 'unit' => 'mEq/L', 'min' => 136, 'max' => 145, 'crit_low' => 120, 'crit_high' => 160, 'decimals' => 0, 'order' => 3],
            ['name' => 'Potassium', 'code' => 'K', 'unit' => 'mEq/L', 'min' => 3.5, 'max' => 5.0, 'crit_low' => 2.5, 'crit_high' => 6.5, 'decimals' => 1, 'order' => 4],
        ];

        foreach ($kftParams as $param) {
            LabTestParameter::create([
                'test_template_id' => $kft->id,
                'name' => $param['name'],
                'code' => $param['code'],
                'unit' => $param['unit'],
                'normal_range_min' => $param['min'],
                'normal_range_max' => $param['max'],
                'critical_low' => $param['crit_low'],
                'critical_high' => $param['crit_high'],
                'decimal_places' => $param['decimals'],
                'sort_order' => $param['order'],
            ]);
        }

        // Urinalysis
        $urine = LabTestTemplate::create([
            'category_id' => $urinalysis->id,
            'name' => 'Urinalysis',
            'code' => 'URINE',
            'description' => 'Complete urine analysis',
            'sample_type' => 'urine',
            'sample_volume' => '50ml',
            'container_type' => 'Sterile urine container',
            'preparation_instructions' => 'Mid-stream clean catch sample',
            'turn_around_time' => 3,
            'price' => 300,
            'is_active' => true,
        ]);

        $urineParams = [
            ['name' => 'pH', 'code' => 'PH', 'unit' => '', 'min' => 4.5, 'max' => 8.0, 'crit_low' => null, 'crit_high' => null, 'decimals' => 1, 'order' => 1],
            ['name' => 'Specific Gravity', 'code' => 'SG', 'unit' => '', 'min' => 1.005, 'max' => 1.030, 'crit_low' => null, 'crit_high' => null, 'decimals' => 3, 'order' => 2],
            ['name' => 'Protein', 'code' => 'PROT', 'unit' => 'mg/dL', 'min' => 0, 'max' => 10, 'crit_low' => null, 'crit_high' => 300, 'decimals' => 0, 'order' => 3],
            ['name' => 'Glucose', 'code' => 'GLU', 'unit' => 'mg/dL', 'min' => 0, 'max' => 0, 'crit_low' => null, 'crit_high' => 1000, 'decimals' => 0, 'order' => 4],
        ];

        foreach ($urineParams as $param) {
            LabTestParameter::create([
                'test_template_id' => $urine->id,
                'name' => $param['name'],
                'code' => $param['code'],
                'unit' => $param['unit'],
                'normal_range_min' => $param['min'],
                'normal_range_max' => $param['max'],
                'critical_low' => $param['crit_low'],
                'critical_high' => $param['crit_high'],
                'decimal_places' => $param['decimals'],
                'sort_order' => $param['order'],
            ]);
        }

        // Blood Glucose
        $glucose = LabTestTemplate::create([
            'category_id' => $biochemistry->id,
            'name' => 'Fasting Blood Glucose',
            'code' => 'FBG',
            'description' => 'Fasting blood sugar test',
            'sample_type' => 'blood',
            'sample_volume' => '2ml',
            'container_type' => 'Gray top (fluoride)',
            'preparation_instructions' => 'Fasting for 8-12 hours required',
            'turn_around_time' => 1,
            'price' => 200,
            'is_active' => true,
        ]);

        LabTestParameter::create([
            'test_template_id' => $glucose->id,
            'name' => 'Glucose',
            'code' => 'GLU',
            'unit' => 'mg/dL',
            'normal_range_min' => 70,
            'normal_range_max' => 100,
            'critical_low' => 40,
            'critical_high' => 400,
            'decimal_places' => 0,
            'sort_order' => 1,
        ]);

        $this->command->info('Lab tests seeded successfully!');
        $this->command->info('Categories: ' . LabTestCategory::count());
        $this->command->info('Test Templates: ' . LabTestTemplate::count());
        $this->command->info('Parameters: ' . LabTestParameter::count());
    }
}
