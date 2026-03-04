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
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->string('drug_name_text')->nullable()->after('inventory_item_id')->comment('Doctor written drug name');
            $table->string('dosage_text')->nullable()->after('drug_name_text')->comment('e.g., 500mg');
            $table->string('frequency_text')->nullable()->after('dosage_text')->comment('e.g., 3x daily');
            $table->string('duration_text')->nullable()->after('frequency_text')->comment('e.g., 7 days');
            $table->text('instructions_text')->nullable()->after('duration_text')->comment('Special instructions');
            $table->foreignId('mapped_drug_id')->nullable()->constrained('pharmacy_drugs')->after('instructions_text')->comment('Pharmacist mapped drug');
            $table->integer('mapped_quantity')->nullable()->after('mapped_drug_id')->comment('Pharmacist adjusted quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->dropColumn(['drug_name_text', 'dosage_text', 'frequency_text', 'duration_text', 'instructions_text', 'mapped_drug_id', 'mapped_quantity']);
        });
    }
};
