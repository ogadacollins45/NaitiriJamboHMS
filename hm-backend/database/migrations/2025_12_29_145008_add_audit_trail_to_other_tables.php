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
        // Triages
        Schema::table('triages', function (Blueprint $table) {
            $table->enum('triage_level', ['non_urgent', 'urgent', 'emergency'])
                  ->nullable()->after('notes');
            $table->foreignId('updated_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
        });

        // Bills
        Schema::table('bills', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
        });

        // Payments
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
        });

        // Lab Requests
        Schema::table('lab_requests', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()
                  ->constrained('staff')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('triages', function (Blueprint $table) {
            $table->dropColumn(['triage_level', 'updated_by']);
        });
        
        Schema::table('bills', function (Blueprint $table) {
            $table->dropColumn(['created_by', 'updated_by']);
        });
        
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['created_by', 'updated_by']);
        });
        
        Schema::table('lab_requests', function (Blueprint $table) {
            $table->dropColumn(['created_by', 'updated_by']);
        });
    }
};
