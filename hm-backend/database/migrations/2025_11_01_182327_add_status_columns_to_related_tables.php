<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Prescriptions
        if (!Schema::hasColumn('prescriptions', 'status')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->enum('status', ['pending', 'billed', 'paid'])->default('pending')->after('total_amount');
            });
        }

        // Treatments
        if (!Schema::hasColumn('treatments', 'status')) {
            Schema::table('treatments', function (Blueprint $table) {
                $table->enum('status', ['active', 'awaiting_billing', 'billed', 'completed'])
                      ->default('active')
                      ->after('diagnosis');
            });
        }
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'status')) {
                $table->dropColumn('status');
            }
        });

        Schema::table('treatments', function (Blueprint $table) {
            if (Schema::hasColumn('treatments', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
