<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index(); // e.g., "Hematology", "Clinical Chemistry"
            $table->string('code', 50)->unique(); // e.g., "HEM", "CHEM"
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_categories');
    }
};
