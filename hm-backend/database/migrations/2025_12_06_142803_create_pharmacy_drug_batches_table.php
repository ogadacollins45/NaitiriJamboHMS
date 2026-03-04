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
        Schema::create('pharmacy_drug_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_id')->constrained('pharmacy_drugs')->restrictOnDelete();
            $table->string('batch_number', 100)->unique();
            
            // Supply Chain Info
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('purchase_order_number', 100)->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->index();
            
            // Quantity Tracking
            $table->integer('quantity_received')->comment('Initial quantity');
            $table->integer('quantity_current')->default(0)->comment('Current available');
            $table->integer('quantity_reserved')->default(0)->comment('Reserved for pending orders');
            $table->integer('quantity_dispensed')->default(0)->comment('Total dispensed');
            $table->integer('quantity_damaged')->default(0);
            $table->integer('quantity_expired')->default(0);
            $table->integer('quantity_returned')->default(0);
            
            // Pricing
            $table->decimal('unit_cost', 10, 2)->comment('Purchase cost per unit');
            $table->decimal('unit_price', 10, 2)->comment('Selling price per unit');
            $table->decimal('vat_percentage', 5, 2)->default(0);
            $table->decimal('markup_percentage', 5, 2)->nullable();
            
            // Storage
            $table->string('storage_location', 100)->nullable()->comment('Shelf A-3, Fridge 2, etc.');
            $table->decimal('storage_temp_min', 5, 2)->nullable();
            $table->decimal('storage_temp_max', 5, 2)->nullable();
            $table->boolean('requires_cold_chain')->default(false);
            
            // Quality & Status
            $table->enum('quality_check_status', ['pending', 'passed', 'failed'])->default('passed');
            $table->text('quality_check_notes')->nullable();
            $table->timestamp('quality_checked_at')->nullable();
            $table->foreignId('quality_checked_by')->nullable()->constrained('staff')->nullOnDelete();
            
            $table->enum('status', ['active', 'expired', 'recalled', 'depleted', 'quarantined'])->default('active')->index();
            $table->text('status_notes')->nullable();
            
            // Receipt Info
            $table->timestamp('received_date');
            $table->foreignId('received_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('receiving_notes')->nullable();
            
            // Alert Settings
            $table->integer('expiry_alert_days')->default(180)->comment('Alert X days before expiry');
            $table->boolean('expiry_alert_sent')->default(false);
            
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['drug_id', 'status']);
            $table->index(['drug_id', 'expiry_date']);
            $table->index('storage_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy_drug_batches');
    }
};
