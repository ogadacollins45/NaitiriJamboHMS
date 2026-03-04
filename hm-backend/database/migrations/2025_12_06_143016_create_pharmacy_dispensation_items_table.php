<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_dispensation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispensation_id')->constrained('pharmacy_dispensations')->cascadeOnDelete();
            $table->foreignId('prescription_item_id')->constrained('pharmacy_prescription_items')->restrictOnDelete();
            $table->foreignId('drug_id')->constrained('pharmacy_drugs')->restrictOnDelete();
            $table->foreignId('batch_id')->comment('Which batch was used (FEFO)')->constrained('pharmacy_drug_batches')->restrictOnDelete();
            
            // Quantities
            $table->integer('quantity_dispensed');
            
            // Pricing (actual at time of dispensation)
            $table->decimal('unit_price', 10, 2)->comment('Actual price charged');
            $table->decimal('unit_cost', 10, 2)->nullable()->comment('Cost from batch');
            $table->decimal('line_total', 10, 2);
            $table->decimal('profit_margin', 10, 2)->nullable()->comment('line_total - (quantity * unit_cost)');
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('vat_amount', 10, 2)->default(0);
            
            // Batch Information (snapshot for audit trail)
            $table->date('expiry_date')->comment('Snapshot from batch');
            $table->string('batch_number', 100)->comment('Snapshot for audit');
            $table->string('storage_location', 100)->nullable();
            
            // Dosage Given (actual instructions provided to patient)
            $table->string('dosage_given', 100)->nullable();
            $table->text('instructions_given')->nullable();
            $table->text('warnings_given')->nullable();
            
            // Substitution Tracking
            $table->boolean('was_substituted')->default(false);
            $table->foreignId('original_drug_id')->nullable()->constrained('pharmacy_drugs')->nullOnDelete();
            $table->text('substitution_reason')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['dispensation_id', 'drug_id']);
            $table->index('batch_id');
            $table->index('prescription_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_dispensation_items');
    }
};
