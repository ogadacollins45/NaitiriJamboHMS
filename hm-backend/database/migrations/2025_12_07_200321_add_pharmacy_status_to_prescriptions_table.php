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
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->enum('pharmacy_status', ['draft', 'sent_to_pharmacy', 'under_review', 'ready_to_dispense', 'dispensed', 'cancelled'])
                ->default('draft')->after('status');
            $table->foreignId('reviewed_by_pharmacist_id')->nullable()->constrained('staff')->after('pharmacy_status');
            $table->text('pharmacist_notes')->nullable()->after('reviewed_by_pharmacist_id');
            $table->timestamp('sent_to_pharmacy_at')->nullable()->after('pharmacist_notes');
            $table->timestamp('reviewed_at')->nullable()->after('sent_to_pharmacy_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['pharmacy_status', 'reviewed_by_pharmacist_id', 'pharmacist_notes', 'sent_to_pharmacy_at', 'reviewed_at']);
        });
    }
};
