<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Alter the 'role' column to include 'facility_clerk'
            // Note: In MySQL, you need to redefine the entire enum
            $table->enum('role', ['admin', 'doctor', 'reception', 'pharmacist', 'labtech', 'facility_clerk'])
                  ->default('doctor')
                  ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Remove 'facility_clerk' from the role enum
            $table->enum('role', ['admin', 'doctor', 'reception', 'pharmacist', 'labtech'])
                  ->default('doctor')
                  ->change();
        });
    }
};
