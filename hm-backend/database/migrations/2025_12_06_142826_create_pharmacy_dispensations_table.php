<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_dispensations', function (Blueprint $table) {
            $table->id();
            $table->string('dispensation_number', 50)->unique()->comment('DISP-20251206-0001');
            
            // Relationships
            $table->foreignId('prescription_id')->constrained('pharmacy_prescriptions')->restrictOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            
            // Dispensation Type & Timing
            $table->enum('dispensation_type', ['full', 'partial', 'refill', 'emergency'])->default('full');
            $table->timestamp('dispensed_at');
            
            // WHO DID IT - Key Feature: Admin dispenses, assigns pharmacist
            $table->foreignId('dispensed_by_staff_id')->comment('WHO actually dispensed (typically admin)')->constrained('staff')->restrictOnDelete();
            $table->foreignId('assigned_pharmacist_id')->nullable()->comment('Pharmacist assigned for this dispensation')->constrained('staff')->nullOnDelete();
            
            // Optional Verification
            $table->foreignId('verified_by_pharmacist_id')->nullable()->comment('Second pharmacist verification')->constrained('staff')->nullOnDelete();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable();
            
            // Patient Collection
            $table->boolean('patient_collected')->default(false);
            $table->timestamp('collected_at')->nullable();
            $table->enum('collection_method', ['in_person', 'delivery', 'proxy'])->default('in_person');
            $table->string('collected_by_name')->nullable()->comment('If proxy collection');
            $table->string('collected_by_id_number', 100)->nullable()->comment('ID verification');
            $table->string('collected_by_relationship')->nullable();
            
            // Financial
            $table->decimal('total_amount', 10, 2);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->decimal('amount_outstanding', 10, 2)->virtualAs('total_amount - amount_paid');
            $table->enum('payment_status', ['unpaid', 'partially_paid', 'paid'])->default('unpaid');
            
            // Clinical
            $table->boolean('patient_counseled')->default(false);
            $table->text('counseling_notes')->nullable();
            $table->text('patient_questions')->nullable();
            $table->text('adverse_reactions_noted')->nullable();
            
            // Special Handling
            $table->boolean('requires_follow_up')->default(false);
            $table->date('follow_up_date')->nullable();
            $table->text('follow_up_instructions')->nullable();
            
            $table->text('special_notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['patient_id', 'dispensed_at']);
            $table->index('assigned_pharmacist_id');
            $table->index('payment_status');
            $table->index(['prescription_id', 'dispensation_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_dispensations');
    }
};
