<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->enum('type', ['in','out','adjustment']);
            $table->integer('quantity');                        // +ve or -ve based on type
            $table->integer('balance_after');                   // snapshot after txn
            $table->string('reason')->nullable();               // e.g., "New shipment"
            $table->string('reference')->nullable();            // e.g., treatment ID / invoice
            $table->string('performed_by')->nullable();         // optional staff name
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('inventory_transactions');
    }
};
