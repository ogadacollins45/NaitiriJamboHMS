<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_stock_alerts', function (Blueprint $table) {
            $table->id();
            
            // Alert Type & Severity
            $table->enum('alert_type', [
                'low_stock',       // Below reorder level
                'expiry_soon',     // Expiring within threshold
                'expired',         // Already expired
                'overstock',       // Excess inventory
                'no_stock',        // Out of stock
                'batch_recall',    // Supplier recall
                'quality_issue'    // Quality/safety concern
            ])->index();
            
            $table->enum('severity', [
                'info',            // Informational
                'warning',         // Requires attention
                'critical'         // Urgent action needed
            ])->index();
            
            // Related Entities
            $table->foreignId('drug_id')->constrained('pharmacy_drugs')->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('pharmacy_drug_batches')->cascadeOnDelete();
            
            // Alert Details
            $table->text('message');
            $table->integer('threshold_value')->nullable()->comment('e.g., reorder level');
            $table->integer('current_value')->nullable()->comment('Current stock');
            $table->date('expiry_date')->nullable()->comment('For expiry alerts');
            $table->integer('days_to_expiry')->nullable();
            
            // Alert Metadata
            $table->json('alert_data')->nullable()->comment('Additional context data');
            $table->text('recommended_action')->nullable();
            
            // Status Tracking
            $table->boolean('is_acknowledged')->default(false)->index();
            $table->foreignId('acknowledged_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->text('acknowledgment_notes')->nullable();
            
            $table->boolean('is_resolved')->default(false)->index();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('resolution_notes')->nullable();
            
            // Auto-dismiss if condition changes
            $table->boolean('auto_dismissed')->default(false);
            $table->timestamp('dismissed_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['alert_type', 'severity']);
            $table->index(['drug_id', 'is_resolved']);
            $table->index(['is_acknowledged', 'is_resolved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_stock_alerts');
    }
};
