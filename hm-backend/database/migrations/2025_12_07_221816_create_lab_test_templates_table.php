<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('lab_test_categories')->restrictOnDelete();
            $table->string('name')->index(); // e.g., "Complete Blood Count", "Lipid Panel"
            $table->string('code', 50)->unique(); // e.g., "CBC", "LIPID"
            $table->text('description')->nullable();
            $table->enum('sample_type', [
                'blood', 'urine', 'stool', 'sputum', 'csf', 'tissue', 
                'swab', 'fluid', 'other'
            ])->index();
            $table->string('sample_volume')->nullable(); // e.g., "5ml", "10ml"
            $table->string('container_type')->nullable(); // e.g., "EDTA tube", "Plain tube"
            $table->text('preparation_instructions')->nullable();
            $table->integer('turn_around_time')->default(24)->comment('Hours');
            $table->decimal('price', 10, 2)->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_templates');
    }
};
