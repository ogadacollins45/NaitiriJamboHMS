<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_drug_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_a_id')->constrained('pharmacy_drugs')->cascadeOnDelete();
            $table->foreignId('drug_b_id')->constrained('pharmacy_drugs')->cascadeOnDelete();
            
            // Interaction Details
            $table->enum('interaction_severity', [
                'minor',           // Minimal clinical significance
                'moderate',        // May require monitoring
                'major',           // Potentially serious
                'contraindicated'  // Should not be used together
            ])->index();
            
            $table->text('interaction_description');
            $table->text('clinical_effect')->nullable()->comment('What happens when combined');
            $table->text('mechanism')->nullable()->comment('How the interaction occurs');
            $table->text('management_recommendation')->nullable();
            $table->text('monitoring_parameters')->nullable();
            
            // Evidence & Documentation
            $table->enum('evidence_level', [
                'theoretical',    // Based on mechanism
                'case_report',    // Isolated case reports
                'study',          // Clinical studies
                'established'     // Well-documented
            ])->default('theoretical');
            
            $table->text('references')->nullable()->comment('Scientific references');
            $table->string('source', 100)->nullable()->comment('Database or reference source');
            
            // Status
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('staff')->nullOnDelete();
            
            $table->timestamps();
            
            // Ensure uniqueness (drug_a_id < drug_b_id to avoid duplicates)
            $table->unique(['drug_a_id', 'drug_b_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_drug_interactions');
    }
};
