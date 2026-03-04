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
        Schema::table('treatments', function (Blueprint $table) {
            $table->enum('treatment_type', ['new', 'revisit'])
                  ->default('new')
                  ->after('visit_date')
                  ->comment('Type of visit: new (first of day) or revisit (same-day return)');
            
            $table->index(['patient_id', 'visit_date', 'treatment_type']);
        });
        
        // Backfill existing treatments as 'new'
        DB::statement("UPDATE treatments SET treatment_type = 'new' WHERE treatment_type IS NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropIndex(['patient_id', 'visit_date', 'treatment_type']);
            $table->dropColumn('treatment_type');
        });
    }
};
