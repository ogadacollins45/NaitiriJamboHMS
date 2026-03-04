<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_request_id')->constrained('lab_requests')->cascadeOnDelete();
            $table->string('sample_number', 100)->unique()->index()->comment('Barcode/unique ID');
            $table->enum('sample_type', [
                'blood', 'urine', 'stool', 'sputum', 'csf', 'tissue', 
                'swab', 'fluid', 'other'
            ]);
            $table->timestamp('collection_date')->index();
            $table->foreignId('collected_by')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('volume')->nullable();
            $table->string('container_type')->nullable();
            $table->string('storage_location')->nullable();
            $table->enum('status', [
                'collected', 
                'received', 
                'processing', 
                'completed', 
                'rejected'
            ])->default('collected')->index();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_samples');
    }
};
