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
        Schema::table('lab_requests', function (Blueprint $table) {
            // Drop the old foreign key constraint that references staff
            $table->dropForeign(['doctor_id']);
            
            // Add new foreign key constraint that references doctors
            $table->foreign('doctor_id')
                  ->references('id')
                  ->on('doctors')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_requests', function (Blueprint $table) {
            // Drop the doctors foreign key
            $table->dropForeign(['doctor_id']);
            
            // Restore the staff foreign key
            $table->foreign('doctor_id')
                  ->references('id')
                  ->on('staff')
                  ->onDelete('restrict');
        });
    }
};
