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
            $table->boolean('is_manual_dispensation')->default(false)->after('notes');
            $table->boolean('registered_on_the_fly')->default(false)->after('is_manual_dispensation');
        });

        Schema::table('prescription_items', function (Blueprint $table) {
            $table->enum('source', ['prescribed', 'manual'])->default('prescribed')->after('instructions_text');
            $table->unsignedBigInteger('manually_added_by')->nullable()->after('source');
            $table->foreign('manually_added_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->dropForeign(['manually_added_by']);
            $table->dropColumn(['source', 'manually_added_by']);
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['is_manual_dispensation', 'registered_on_the_fly']);
        });
    }
};
