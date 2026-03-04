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
        Schema::create('pharmacy_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');
            $table->foreignId('pharmacist_id')->nullable()->constrained('staff')->onDelete('set null');
            $table->enum('status', ['pending', 'dispensed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('dispensed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy_orders');
    }
};
