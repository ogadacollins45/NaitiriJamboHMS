<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->timestamp('dispensed_at')->nullable()->after('sent_to_pharmacy_at');
            $table->unsignedBigInteger('dispensed_by_staff_id')->nullable()->after('dispensed_at');
            $table->text('dispensing_notes')->nullable()->after('dispensed_by_staff_id');
            
            $table->foreign('dispensed_by_staff_id')->references('id')->on('staff')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropForeign(['dispensed_by_staff_id']);
            $table->dropColumn(['dispensed_at', 'dispensed_by_staff_id', 'dispensing_notes']);
        });
    }
};
