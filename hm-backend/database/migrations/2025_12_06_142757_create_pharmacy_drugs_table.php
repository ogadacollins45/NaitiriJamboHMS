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
        Schema::create('pharmacy_drugs', function (Blueprint $table) {
            $table->id();
            $table->string('drug_code', 50)->unique()->comment('e.g., DRG-0001');
            $table->string('generic_name')->index();
            $table->json('brand_names')->nullable()->comment('["Panadol", "Tylenol"]');
            
            // Drug Form & Strength
            $table->enum('dosage_form', [
                'tablet', 'capsule', 'syrup', 'suspension', 'injection', 
                'cream', 'ointment', 'gel', 'drops', 'inhaler', 'suppository',
                'patch', 'powder', 'solution', 'lotion', 'spray'
            ]);
            $table->string('strength', 100)->nullable()->comment('e.g., 500mg, 5mg/ml');
            $table->enum('route_of_administration', [
                'oral', 'iv', 'im', 'sc', 'topical', 'inhalation', 
                'rectal', 'vaginal', 'ophthalmic', 'otic', 'nasal', 'transdermal'
            ])->nullable();
            
            // Classification
            $table->string('drug_category', 100)->index()->comment('Analgesic, Antibiotic, etc.');
            $table->string('therapeutic_class', 100)->nullable();
            $table->boolean('controlled_substance')->default(false)->index();
            $table->string('schedule')->nullable()->comment('Schedule I-V for controlled substances');
            $table->boolean('requires_prescription')->default(true);
            
            // Storage & Handling
            $table->text('storage_conditions')->nullable();
            $table->decimal('storage_temp_min', 5, 2)->nullable();
            $table->decimal('storage_temp_max', 5, 2)->nullable();
            
            // Clinical Information
            $table->text('indications')->nullable();
            $table->text('contraindications')->nullable();
            $table->text('side_effects')->nullable();
            $table->json('drug_interactions')->nullable()->comment('[{"drug_id": 123, "severity": "major"}]');
            $table->text('warnings')->nullable();
            $table->text('precautions')->nullable();
            
            // Special Populations
            $table->enum('pregnancy_category', ['A', 'B', 'C', 'D', 'X', 'N/A'])->default('N/A');
            $table->boolean('safe_in_pregnancy')->default(false);
            $table->boolean('safe_in_lactation')->default(false);
            $table->boolean('pediatric_use')->default(true);
            $table->text('geriatric_considerations')->nullable();
            $table->text('renal_dosing')->nullable();
            $table->text('hepatic_dosing')->nullable();
            
            // Manufacturing
            $table->string('manufacturer')->nullable();
            $table->text('active_ingredient')->nullable();
            $table->text('inactive_ingredients')->nullable();
            
            // Pricing & Inventory
            $table->string('unit_of_measure', 50)->comment('tablet, ml, vial, etc.');
            $table->decimal('default_unit_price', 10, 2)->default(0);
            $table->integer('reorder_level')->default(50)->comment('Alert when stock below this');
            $table->integer('reorder_quantity')->default(100)->comment('Suggested reorder quantity');
            
            // Status & Audit
            $table->boolean('is_active')->default(true)->index();
            $table->text('deactivation_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy_drugs');
    }
};
