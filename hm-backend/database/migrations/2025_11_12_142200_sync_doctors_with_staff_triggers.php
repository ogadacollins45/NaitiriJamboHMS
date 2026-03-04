<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // 🧹 1. Clear existing doctors
        DB::statement('DELETE FROM doctors;');

        // 🧮 2. Create triggers to keep doctors in sync with staff
        if ($driver === 'mysql') {
            // MySQL syntax
            DB::unprepared("
                CREATE TRIGGER staff_after_insert
                AFTER INSERT ON staff
                FOR EACH ROW
                BEGIN
                  IF NEW.role = 'doctor' THEN
                    INSERT INTO doctors (first_name, last_name, phone, email, created_at, updated_at)
                    VALUES (NEW.first_name, NEW.last_name, NEW.phone, NEW.email, NEW.created_at, NEW.updated_at)
                    ON DUPLICATE KEY UPDATE
                        first_name = VALUES(first_name),
                        last_name  = VALUES(last_name),
                        phone      = VALUES(phone),
                        email      = VALUES(email),
                        updated_at = VALUES(updated_at);
                  END IF;
                END
            ");

            DB::unprepared("
                CREATE TRIGGER staff_after_update
                AFTER UPDATE ON staff
                FOR EACH ROW
                BEGIN
                  IF NEW.role = 'doctor' THEN
                    INSERT INTO doctors (first_name, last_name, phone, email, created_at, updated_at)
                    VALUES (NEW.first_name, NEW.last_name, NEW.phone, NEW.email, NEW.created_at, NEW.updated_at)
                    ON DUPLICATE KEY UPDATE
                        first_name = VALUES(first_name),
                        last_name  = VALUES(last_name),
                        phone      = VALUES(phone),
                        email      = VALUES(email),
                        updated_at = VALUES(updated_at);
                  ELSEIF OLD.role = 'doctor' AND NEW.role <> 'doctor' THEN
                    DELETE FROM doctors WHERE email = OLD.email;
                  END IF;
                END
            ");

            DB::unprepared("
                CREATE TRIGGER staff_after_delete
                AFTER DELETE ON staff
                FOR EACH ROW
                BEGIN
                  IF OLD.role = 'doctor' THEN
                    DELETE FROM doctors WHERE email = OLD.email;
                  END IF;
                END
            ");
        } else {
            // SQLite syntax
            DB::unprepared("
                CREATE TRIGGER staff_after_insert
                AFTER INSERT ON staff
                FOR EACH ROW
                WHEN NEW.role = 'doctor'
                BEGIN
                    INSERT OR REPLACE INTO doctors (first_name, last_name, phone, email, created_at, updated_at)
                    VALUES (NEW.first_name, NEW.last_name, NEW.phone, NEW.email, NEW.created_at, NEW.updated_at);
                END
            ");

            DB::unprepared("
                CREATE TRIGGER staff_after_update
                AFTER UPDATE ON staff
                FOR EACH ROW
                BEGIN
                    DELETE FROM doctors WHERE email = OLD.email AND OLD.role = 'doctor';
                    INSERT OR REPLACE INTO doctors (first_name, last_name, phone, email, created_at, updated_at)
                    SELECT NEW.first_name, NEW.last_name, NEW.phone, NEW.email, NEW.created_at, NEW.updated_at
                    WHERE NEW.role = 'doctor';
                END
            ");

            DB::unprepared("
                CREATE TRIGGER staff_after_delete
                AFTER DELETE ON staff
                FOR EACH ROW
                WHEN OLD.role = 'doctor'
                BEGIN
                    DELETE FROM doctors WHERE email = OLD.email;
                END
            ");
        }

        // 🧩 3. One-time initial sync
        if ($driver === 'mysql') {
            DB::statement("
                INSERT IGNORE INTO doctors (first_name, last_name, phone, email, created_at, updated_at)
                SELECT first_name, last_name, phone, email, created_at, updated_at
                FROM staff WHERE role = 'doctor';
            ");
        } else {
            DB::statement("
                INSERT OR IGNORE INTO doctors (first_name, last_name, phone, email, created_at, updated_at)
                SELECT first_name, last_name, phone, email, created_at, updated_at
                FROM staff WHERE role = 'doctor';
            ");
        }
    }

    public function down(): void
    {
        // Remove triggers if rolling back
        DB::unprepared('DROP TRIGGER IF EXISTS staff_after_insert;');
        DB::unprepared('DROP TRIGGER IF EXISTS staff_after_update;');
        DB::unprepared('DROP TRIGGER IF EXISTS staff_after_delete;');
    }
};
