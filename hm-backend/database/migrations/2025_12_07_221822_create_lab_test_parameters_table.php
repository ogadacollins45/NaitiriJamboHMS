<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_template_id')->constrained('lab_test_templates')->cascadeOnDelete();
            $table->string('name')->index(); // e.g., "Hemoglobin", "WBC Count"
            $table->string('code', 50); // e.g., "HGB", "WBC"
            $table->string('unit', 50)->nullable(); // e.g., "g/dL", "10^3/μL"
            $table->decimal('normal_range_min', 10, 3)->nullable();
            $table->decimal('normal_range_max', 10, 3)->nullable();
            $table->decimal('critical_low', 10, 3)->nullable();
            $table->decimal('critical_high', 10, 3)->nullable();
            $table->integer('decimal_places')->default(2);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['test_template_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_parameters');
    }
};
