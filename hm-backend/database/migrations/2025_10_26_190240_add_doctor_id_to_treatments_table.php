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
            if (!Schema::hasColumn('treatments', 'doctor_id')) {
                $table->foreignId('doctor_id')
                      ->nullable()
                      ->after('patient_id')
                      ->constrained('doctors')
                      ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            if (Schema::hasColumn('treatments', 'doctor_id')) {
                $table->dropForeign(['doctor_id']);
                $table->dropColumn('doctor_id');
            }
        });
    }
};
