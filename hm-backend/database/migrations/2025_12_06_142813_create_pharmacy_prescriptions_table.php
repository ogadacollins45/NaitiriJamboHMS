<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_prescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_number', 50)->unique()->comment('RX-20251206-0001');
            
            // Relationships
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('treatment_id')->nullable()->constrained('treatments')->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            
            // Prescription Details
            $table->timestamp('prescribing_date');
            $table->text('diagnosis')->nullable();
            $table->enum('prescription_type', ['inpatient', 'outpatient', 'emergency'])->default('outpatient');
            $table->enum('priority', ['routine', 'urgent', 'stat'])->default('routine');
            $table->date('valid_until')->nullable()->comment('Prescription validity');
            
            // Status Tracking
            $table->enum('status', [
                'active', 
                'partially_dispensed', 
                'fully_dispensed', 
                'cancelled', 
                'expired'
            ])->default('active')->index();
            
            // Clinical Info
            $table->text('special_instructions')->nullable();
            $table->text('allergies_noted')->nullable()->comment('Patient allergies at time of prescription');
            $table->text('patient_warnings')->nullable();
            
            // Financial
            $table->decimal('total_estimated_cost', 10, 2)->default(0);
            $table->decimal('total_dispensed_cost', 10, 2)->default(0);
            
            $table->text('notes')->nullable();
            
            // Cancellation
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('cancellation_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['patient_id', 'status']);
            $table->index('prescribing_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_prescriptions');
    }
};
