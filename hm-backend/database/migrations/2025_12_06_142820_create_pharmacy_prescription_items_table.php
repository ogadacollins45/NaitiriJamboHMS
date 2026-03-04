<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('pharmacy_prescriptions')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('pharmacy_drugs')->restrictOnDelete();
            
            // Prescribed Quantities
            $table->integer('quantity_prescribed');
            $table->integer('quantity_dispensed')->default(0);
            $table->integer('quantity_remaining')->virtualAs('quantity_prescribed - quantity_dispensed');
            
            // Dosage Instructions
            $table->string('dosage', 100)->comment('e.g., 500mg, 2 tablets');
            $table->string('frequency', 100)->comment('e.g., 3 times daily, Every 8 hours');
            $table->string('route', 50)->nullable()->comment('oral, IV, topical, etc.');
            $table->integer('duration_days')->nullable();
            $table->string('duration_text', 100)->nullable()->comment('7 days, Until symptoms resolve');
            $table->text('special_instructions')->nullable()->comment('Take with food, Avoid alcohol');
            $table->text('administration_instructions')->nullable();
            
            // Substitution & Alternatives
            $table->boolean('substitute_allowed')->default(false);
            $table->json('alternative_drugs')->nullable()->comment('[{"drug_id": 123, "reason": "generic"}]');
            
            // Status
            $table->enum('status', [
                'pending', 
                'partially_dispensed', 
                'fully_dispensed', 
                'cancelled',
                'substituted'
            ])->default('pending')->index();
            
            // Pricing (snapshot at prescription time)
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->decimal('line_total', 10, 2)->nullable();
            
            // Dispensation Tracking
            $table->timestamp('first_dispensed_at')->nullable();
            $table->timestamp('fully_dispensed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['prescription_id', 'status']);
            $table->index('drug_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_prescription_items');
    }
};
