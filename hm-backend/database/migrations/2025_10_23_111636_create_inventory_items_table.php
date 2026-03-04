<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();              // e.g., MED-0001
            $table->string('name');
            $table->enum('category', ['Medicine','Equipment','Consumable']);
            $table->string('subcategory')->nullable();
            $table->unsignedInteger('quantity')->default(0);
            $table->string('unit')->nullable();                 // tablet, piece, box
            $table->unsignedInteger('reorder_level')->default(0);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->date('expiry_date')->nullable();            // null = N/A
            $table->string('batch_no')->nullable();
            $table->string('location')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('inventory_items');
    }
};
