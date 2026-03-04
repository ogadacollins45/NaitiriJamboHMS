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
            $table->text('chief_complaint')->nullable()->after('treatment_notes');
            $table->text('premedication')->nullable()->after('chief_complaint');
            $table->text('past_medical_history')->nullable()->after('premedication');
            $table->text('systemic_review')->nullable()->after('past_medical_history');
            $table->text('impression')->nullable()->after('systemic_review');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropColumn([
                'chief_complaint',
                'premedication',
                'past_medical_history',
                'systemic_review',
                'impression'
            ]);
        });
    }
};
