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
        Schema::table('treatments', function (Blueprint $table) {
            // Add diagnosis status field
            $table->enum('diagnosis_status', ['pending', 'confirmed'])->default('pending')->after('diagnosis');
            
            // Make diagnosis nullable
            $table->text('diagnosis')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropColumn('diagnosis_status');
            // Note: reversing nullable change would require knowing original state
        });
    }
};
