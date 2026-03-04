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
        Schema::create('triages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->integer('blood_pressure_systolic')->nullable();
            $table->integer('blood_pressure_diastolic')->nullable();
            $table->decimal('temperature', 5, 2)->nullable(); // e.g., 37.5
            $table->integer('pulse_rate')->nullable(); // beats per minute
            $table->integer('respiratory_rate')->nullable(); // breaths per minute
            $table->decimal('weight', 6, 2)->nullable(); // kg
            $table->decimal('height', 6, 2)->nullable(); // cm
            $table->integer('oxygen_saturation')->nullable(); // SpO2 percentage
            $table->text('chief_complaint')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('staff')->onDelete('cascade'); // nurse/reception/doctor
            $table->timestamps();

            // Indexes
            $table->index('patient_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('triages');
    }
};
