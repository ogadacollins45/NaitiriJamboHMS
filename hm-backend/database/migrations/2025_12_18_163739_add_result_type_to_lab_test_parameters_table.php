<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_test_parameters', function (Blueprint $table) {
            $table->enum('result_type', ['range', 'binary'])->default('range')->after('code');
        });
    }

    public function down(): void
    {
        Schema::table('lab_test_parameters', function (Blueprint $table) {
            $table->dropColumn('result_type');
        });
    }
};
