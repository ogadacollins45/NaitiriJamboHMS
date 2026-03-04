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
        Schema::table('bill_items', function (Blueprint $table) {
            // Add lab-related foreign keys for lab test billing
            $table->unsignedBigInteger('lab_request_id')->nullable()->after('inventory_item_id');
            $table->unsignedBigInteger('lab_test_id')->nullable()->after('lab_request_id');
            
            // Update category enum to include lab_test
            $table->enum('category', ['consultation', 'prescription', 'lab', 'lab_test', 'service', 'custom'])
                ->default('custom')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            $table->dropColumn(['lab_request_id', 'lab_test_id']);
            // Note: Reverting enum change requires manual SQL or recreating the column
        });
    }
};
