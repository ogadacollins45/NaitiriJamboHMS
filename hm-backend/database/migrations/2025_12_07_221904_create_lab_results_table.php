<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_request_test_id')->constrained('lab_request_tests')->cascadeOnDelete();
            $table->foreignId('lab_request_id')->constrained('lab_requests')->cascadeOnDelete();
            $table->foreignId('test_template_id')->constrained('lab_test_templates')->restrictOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamp('performed_at')->index();
            $table->timestamp('verified_at')->nullable();
            $table->enum('status', ['draft', 'submitted', 'verified'])->default('draft')->index();
            $table->text('overall_comment')->nullable();
            $table->boolean('quality_control_passed')->default(true);
            $table->timestamps();

            $table->index(['lab_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};
