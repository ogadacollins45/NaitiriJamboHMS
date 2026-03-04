<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');

            // What is this charge about?
            // consultation | prescription | lab | service | custom
            $table->enum('category', ['consultation', 'prescription', 'lab', 'service', 'custom'])->default('custom');
            $table->string('description'); // e.g. "Consultation – Dr. James" or "Paracetamol 500mg"

            // Optional references (not enforced to keep this table generic)
            $table->unsignedBigInteger('prescription_id')->nullable();
            $table->unsignedBigInteger('prescription_item_id')->nullable();
            $table->unsignedBigInteger('inventory_item_id')->nullable();

            // Amounts
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('amount', 10, 2);   // unit price or line rate
            $table->decimal('subtotal', 10, 2); // amount * quantity

            $table->timestamps();

            $table->index(['bill_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_items');
    }
};
