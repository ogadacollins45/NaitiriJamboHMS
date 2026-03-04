<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('admission_id')->constrained('admissions')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

            // Vitals (all optional)
            $table->string('bp')->nullable();           // e.g. "120/80"
            $table->string('pulse')->nullable();        // e.g. "72 bpm"
            $table->string('temp')->nullable();         // e.g. "36.6°C"
            $table->string('spo2')->nullable();         // e.g. "98%"

            // Nursing note / observation
            $table->text('note')->nullable();

            // The actual time this observation was recorded (editable)
            $table->timestamp('recorded_at')->nullable();

            $table->timestamps();

            $table->index(['admission_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_entries');
    }
};
