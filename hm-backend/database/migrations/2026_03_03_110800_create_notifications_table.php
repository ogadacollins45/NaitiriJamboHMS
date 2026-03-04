<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Adds all notification columns that may be missing from the notifications table.
 *
 * History:
 *  - 2026_02_06: The original migration created only `id` + `timestamps`.
 *    On dev it was later modified to include the full schema, but it had
 *    already run on production — so production still has only those two columns.
 *  - 2026_03_03 (this file): Adds every missing column safely using hasColumn()
 *    checks so it is idempotent on both dev and production databases.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'type')) {
                $table->string('type')->default('lab_completed')->after('id');
            }
            if (!Schema::hasColumn('notifications', 'title')) {
                $table->string('title')->after('type');
            }
            if (!Schema::hasColumn('notifications', 'body')) {
                $table->json('body')->after('title');
            }
            if (!Schema::hasColumn('notifications', 'target_roles')) {
                $table->json('target_roles')->after('body');
            }
            if (!Schema::hasColumn('notifications', 'is_read_by')) {
                // JSON columns cannot have a DEFAULT in MySQL via ALTER TABLE,
                // so we add it as nullable and set the default via raw SQL below.
                $table->json('is_read_by')->nullable()->after('target_roles');
            }
        });

        // Set JSON array default (MySQL 8+ supports expression defaults)
        // Wrapped in try-catch — some older MySQL 5.7 hosts don't support this syntax.
        try {
            DB::statement("ALTER TABLE notifications ALTER COLUMN is_read_by SET DEFAULT (JSON_ARRAY())");
        } catch (\Throwable $e) {
            // Silently skip — the column is still nullable, which is fine.
            // Notification::create() always passes is_read_by explicitly.
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $columns = ['is_read_by', 'target_roles', 'body', 'title', 'type'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('notifications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
