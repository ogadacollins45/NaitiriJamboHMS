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
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL: Modify ENUM to include pharmacist and labtech
            DB::statement("ALTER TABLE staff MODIFY COLUMN role ENUM('admin', 'doctor', 'reception', 'pharmacist', 'labtech') DEFAULT 'doctor'");
        } else {
            // SQLite: ENUMs don't exist, column is already TEXT with check constraint
            // SQLite is more permissive, so new values work automatically
            // Just update any check constraint if needed (SQLite typically doesn't enforce ENUMs strictly)
            // No action needed for SQLite - TEXT columns accept any value
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL: Revert back to original ENUM values
            DB::statement("ALTER TABLE staff MODIFY COLUMN role ENUM('admin', 'doctor', 'reception') DEFAULT 'doctor'");
        } else {
            // SQLite: No action needed
        }
    }
};
