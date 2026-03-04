<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('added_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->enum('status', ['waiting', 'in_progress', 'completed', 'removed'])->default('waiting');
            $table->integer('priority')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('attended_at')->nullable();
            $table->foreignId('attended_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->timestamps();

            // Indexes for better performance
            $table->index(['status', 'priority', 'created_at']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue');
    }
};
