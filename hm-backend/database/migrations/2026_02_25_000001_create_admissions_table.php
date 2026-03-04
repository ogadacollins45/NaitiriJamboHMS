<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');

            // Ward / Bed
            $table->string('ward');               // e.g. Medical, Surgical, Maternity
            $table->string('bed')->nullable();    // e.g. "Bed 3", "Room 5B"

            // Admission details
            $table->enum('admission_type', ['general', 'maternity'])->default('general');
            $table->string('payment_type')->nullable(); // cash, nhif, etc.
            $table->text('reason')->nullable();         // reason / provisional diagnosis

            // Status lifecycle
            $table->enum('status', ['active', 'discharged', 'transferred'])->default('active');

            // Timestamps for the admission episode
            $table->timestamp('admitted_at')->nullable();
            $table->timestamp('discharged_at')->nullable();
            $table->text('discharge_note')->nullable();

            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->timestamps();

            $table->index(['patient_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admissions');
    }
};
