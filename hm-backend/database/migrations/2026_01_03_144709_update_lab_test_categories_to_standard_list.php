<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Define the standard lab test categories
        $categories = [
            ['code' => 'HEM', 'name' => 'Hematology', 'description' => 'Blood-related tests'],
            ['code' => 'BIO', 'name' => 'Biochemistry', 'description' => 'Biochemical analysis'],
            ['code' => 'MICRO', 'name' => 'Microbiology', 'description' => 'Microbiological analysis'],
            ['code' => 'SERO', 'name' => 'Serology / Immunology', 'description' => 'Immunological and serological tests'],
            ['code' => 'PATH', 'name' => 'Pathology', 'description' => 'Tissue and cellular analysis'],
            ['code' => 'URINE', 'name' => 'Urinalysis', 'description' => 'Urine tests'],
            ['code' => 'STOOL', 'name' => 'Stool Analysis', 'description' => 'Stool tests'],
            ['code' => 'ENDO', 'name' => 'Endocrinology', 'description' => 'Hormone and endocrine tests'],
            ['code' => 'BB', 'name' => 'Blood Bank', 'description' => 'Blood banking and transfusion tests'],
            ['code' => 'OTHER', 'name' => 'Other', 'description' => 'Other laboratory tests'],
        ];

        foreach ($categories as $category) {
            // Check if category exists by code
            $exists = DB::table('lab_test_categories')
                ->where('code', $category['code'])
                ->exists();

            if (!$exists) {
                // Insert new category
                DB::table('lab_test_categories')->insert([
                    'code' => $category['code'],
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Update existing category (in case name or description needs updating)
                DB::table('lab_test_categories')
                    ->where('code', $category['code'])
                    ->update([
                        'name' => $category['name'],
                        'description' => $category['description'],
                        'updated_at' => now(),
                    ]);
            }
        }

        // Update 'CHEM' to 'BIO' if it exists (rename Clinical Chemistry to Biochemistry)
        DB::table('lab_test_categories')
            ->where('code', 'CHEM')
            ->update([
                'code' => 'BIO',
                'name' => 'Biochemistry',
                'description' => 'Biochemical analysis',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't delete categories in the down migration to preserve data
        // If you need to revert, you can manually remove the added categories
    }
};
