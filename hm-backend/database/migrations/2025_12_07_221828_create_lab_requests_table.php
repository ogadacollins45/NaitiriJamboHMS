<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 50)->unique()->index(); // e.g., "LAB-20251208-0001"
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->restrictOnDelete();
            $table->foreignId('treatment_id')->nullable()->constrained('treatments')->nullOnDelete();
            $table->unsignedBigInteger('visit_id')->nullable()->index();
            $table->enum('priority', ['routine', 'urgent', 'stat'])->default('routine')->index();
            $table->text('clinical_notes')->nullable()->comment('Symptoms, suspected diagnosis');
            $table->timestamp('request_date')->index();
            $table->enum('status', [
                'pending', 
                'sample_collected', 
                'processing', 
                'completed', 
                'cancelled', 
                'rejected'
            ])->default('pending')->index();
            $table->foreignId('lab_technician_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'status']);
            $table->index(['created_at', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_requests');
    }
};
