<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pharmacy_reorder_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pharmacy_drug_id');
            $table->string('status')->default('pending'); // pending, completed, cancelled
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->timestamps();

            $table->foreign('pharmacy_drug_id')->references('id')->on('pharmacy_drugs')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_reorder_requests');
    }
};
