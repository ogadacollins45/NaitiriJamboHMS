<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('lab_completed');
            $table->string('title');
            $table->json('body');                  // { patient, request_no, patient_id, treatment_id }
            $table->json('target_roles');          // ["doctor","admin"]
            $table->json('is_read_by')->default('[]'); // array of user IDs who dismissed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
