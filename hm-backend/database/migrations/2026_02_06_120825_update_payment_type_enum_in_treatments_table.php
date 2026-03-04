<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we need to use raw SQL to modify the enum
        // For SQLite, enums are not enforced, so we just need to update the check constraint if any
        
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE treatments MODIFY COLUMN payment_type ENUM('Cash', 'Mobile Money', 'Bank Transfer', 'Insurance', 'Other') NULL");
        } else {
            // For SQLite, we don't need to do anything as it doesn't enforce enum types
            // The column already exists and can accept any string value
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            // Revert to original MOH enum values
            DB::statement("ALTER TABLE treatments MODIFY COLUMN payment_type ENUM('cash', 'insurance', 'nhif', 'waived', 'other') NULL");
        }
    }
};
