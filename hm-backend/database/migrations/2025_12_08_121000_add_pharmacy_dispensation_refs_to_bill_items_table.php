<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            $table->unsignedBigInteger('pharmacy_dispensation_id')->nullable()->after('lab_test_id');
            $table->unsignedBigInteger('pharmacy_dispensation_item_id')->nullable()->after('pharmacy_dispensation_id');

            $table->index(['pharmacy_dispensation_id']);
            $table->index(['pharmacy_dispensation_item_id']);
        });
    }

    public function down(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_dispensation_id']);
            $table->dropIndex(['pharmacy_dispensation_item_id']);
            $table->dropColumn(['pharmacy_dispensation_id', 'pharmacy_dispensation_item_id']);
        });
    }
};
