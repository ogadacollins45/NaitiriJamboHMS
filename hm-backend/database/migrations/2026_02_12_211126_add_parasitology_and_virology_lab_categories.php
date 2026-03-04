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
        // Add Parasitology and Virology lab test categories
        $categories = [
            [
                'code' => 'PARA',
                'name' => 'Parasitology',
                'description' => 'Parasitic organism and infection tests',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'VIRO',
                'name' => 'Virology',
                'description' => 'Viral infection and detection tests',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($categories as $category) {
            // Check if category already exists by code
            $exists = DB::table('lab_test_categories')
                ->where('code', $category['code'])
                ->exists();

            if (!$exists) {
                // Insert new category
                DB::table('lab_test_categories')->insert($category);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the added categories
        DB::table('lab_test_categories')
            ->whereIn('code', ['PARA', 'VIRO'])
            ->delete();
    }
};
