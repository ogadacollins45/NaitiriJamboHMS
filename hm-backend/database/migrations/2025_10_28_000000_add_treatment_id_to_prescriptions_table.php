<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('prescriptions', 'treatment_id')) {
                $table->foreignId('treatment_id')
                      ->nullable()
                      ->after('patient_id')
                      ->constrained('treatments')
                      ->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'treatment_id')) {
                $table->dropForeign(['treatment_id']);
                $table->dropColumn('treatment_id');
            }
        });
    }
};
