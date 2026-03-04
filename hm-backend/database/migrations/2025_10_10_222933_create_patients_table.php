<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('upid')->unique()->nullable(); // CH-XXXXX auto in model
            $table->string('national_id', 50)->nullable()->unique(); // ✅ new field
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('gender', ['M', 'F', 'O']);
            $table->date('dob')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
