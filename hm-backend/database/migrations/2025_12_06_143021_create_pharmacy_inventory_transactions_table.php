<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number', 50)->unique()->comment('TXN-20251206-0001');
            
            // Relationships
            $table->foreignId('batch_id')->constrained('pharmacy_drug_batches')->restrictOnDelete();
            $table->foreignId('drug_id')->constrained('pharmacy_drugs')->restrictOnDelete();
            
            // Transaction Type & Details
            $table->enum('transaction_type', [
                'receipt',          // New stock received
                'dispensation',     // Dispensed to patient
                'return',           // Patient return
                'adjustment',       // Stock count adjustment
                'transfer_out',     // Moved to another location
                'transfer_in',      // Received from another location
                'damage',           // Damaged/broken
                'expiry',           // Expired stock removal
                'recall',           // Supplier recall
                'loss',             // Theft/loss
                'sample'            // Free samples given
            ])->index();
            
            // Quantity Changes
            $table->integer('quantity')->comment('Positive or negative');
            $table->integer('balance_before');
            $table->integer('balance_after');
            
            // Reference Information
            $table->string('reference_type', 50)->nullable()->comment('dispensation, purchase_order, etc.');
            $table->bigInteger('reference_id')->nullable()->comment('ID of related record');
            $table->index(['reference_type', 'reference_id'], 'idx_pharm_inv_txn_reference');
            
            // Location (for transfers)
            $table->string('from_location', 100)->nullable();
            $table->string('to_location', 100)->nullable();
            
            // Reason & Notes
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            
            // Who & When
            $table->foreignId('performed_by')->constrained('staff')->restrictOnDelete();
            $table->foreignId('authorized_by')->nullable()->comment('Supervisor approval')->constrained('staff')->nullOnDelete();
            $table->timestamp('transaction_date')->index();
            $table->boolean('requires_authorization')->default(false);
            $table->boolean('is_authorized')->default(false);
            
            // Financial Impact (for valuations)
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->decimal('total_value', 10, 2)->nullable()->comment('quantity * unit_cost');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['batch_id', 'transaction_date']);
            $table->index(['drug_id', 'transaction_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_inventory_transactions');
    }
};
