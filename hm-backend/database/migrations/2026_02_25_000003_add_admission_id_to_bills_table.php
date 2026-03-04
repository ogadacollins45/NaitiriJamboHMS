<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            // Link a bill to an inpatient admission (nullable for existing outpatient bills)
            $table->foreignId('admission_id')
                ->nullable()
                ->after('treatment_id')
                ->constrained('admissions')
                ->onDelete('set null');

            // Add a bill_type to distinguish outpatient vs inpatient
            $table->enum('bill_type', ['outpatient', 'inpatient'])
                ->default('outpatient')
                ->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropForeign(['admission_id']);
            $table->dropColumn(['admission_id', 'bill_type']);
        });
    }
};
