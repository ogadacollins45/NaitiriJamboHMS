<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_request_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_request_id')->constrained('lab_requests')->cascadeOnDelete();
            $table->foreignId('test_template_id')->constrained('lab_test_templates')->restrictOnDelete();
            $table->enum('status', ['pending', 'processing', 'completed'])->default('pending')->index();
            $table->enum('priority', ['routine', 'urgent', 'stat'])->default('routine');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['lab_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_request_tests');
    }
};
