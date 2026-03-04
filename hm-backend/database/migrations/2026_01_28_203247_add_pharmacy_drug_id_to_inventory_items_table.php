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
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('pharmacy_drug_id')
                  ->nullable()
                  ->after('supplier_id')
                  ->constrained('pharmacy_drugs')
                  ->nullOnDelete()
                  ->comment('Link to pharmacy drug for Medicine category items');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['pharmacy_drug_id']);
            $table->dropColumn('pharmacy_drug_id');
        });
    }
};
