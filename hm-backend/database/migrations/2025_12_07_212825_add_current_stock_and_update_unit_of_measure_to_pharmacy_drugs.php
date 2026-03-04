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
        Schema::table('pharmacy_drugs', function (Blueprint $table) {
            // Add current_stock field
            $table->integer('current_stock')->default(0)->after('default_unit_price');
            
            // Make unit_of_measure nullable since dosage_form already captures this
            $table->string('unit_of_measure', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pharmacy_drugs', function (Blueprint $table) {
            $table->dropColumn('current_stock');
            $table->string('unit_of_measure', 50)->nullable(false)->change();
        });
    }
};
