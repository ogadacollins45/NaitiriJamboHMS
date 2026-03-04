<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->foreignId('bill_id')
                  ->nullable()
                  ->after('doctor_id')
                  ->constrained('bills')
                  ->onDelete('set null')
                  ->comment('Link to the bill this treatment belongs to');
            
            $table->index('bill_id');
        });
        
        // Backfill bill_id from existing bills
        DB::statement("
            UPDATE treatments t
            INNER JOIN bills b ON b.treatment_id = t.id
            SET t.bill_id = b.id
            WHERE t.bill_id IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table) {
            $table->dropForeign(['bill_id']);
            $table->dropIndex(['bill_id']);
            $table->dropColumn('bill_id');
        });
    }
};
