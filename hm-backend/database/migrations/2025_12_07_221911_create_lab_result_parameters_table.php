<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_result_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_result_id')->constrained('lab_results')->cascadeOnDelete();
            $table->foreignId('parameter_id')->constrained('lab_test_parameters')->restrictOnDelete();
            $table->string('value')->nullable();
            $table->string('unit', 50)->nullable();
            $table->boolean('is_abnormal')->default(false)->index();
            $table->enum('abnormal_flag', ['', 'L', 'H', 'LL', 'HH'])->default('')->comment('L=Low, H=High, LL=Critical Low, HH=Critical High');
            $table->string('reference_range')->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index(['lab_result_id', 'is_abnormal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_result_parameters');
    }
};
