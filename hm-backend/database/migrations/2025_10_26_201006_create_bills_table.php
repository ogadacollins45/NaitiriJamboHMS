<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();

            // Who is being billed
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');

            // Link to a visit/treatment (optional but recommended)
            $table->foreignId('treatment_id')->nullable()->constrained('treatments')->onDelete('set null');

            // Optional link to the doctor responsible (useful for consultation fees)
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');

            // Totals & status
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);

            // unpaid | partial | paid
            $table->enum('status', ['unpaid', 'partial', 'paid'])->default('unpaid');

            $table->text('notes')->nullable();

            $table->timestamps();

            // Handy index for queries
            $table->index(['patient_id', 'treatment_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
