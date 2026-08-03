<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unlike the catalog tables (brands, categories, device_*), email and
     * phone uniqueness is security/auth-critical and checked on a public,
     * concurrent endpoint (registration/OTP) - relying on an app-layer
     * check alone (Rule::unique()->whereNull('deleted_at'), no DB backing)
     * would open a real race window: two near-simultaneous registrations
     * could both pass validation before either commits, producing two
     * active accounts sharing a phone number. MySQL has no partial/filtered
     * unique index, so this uses a generated column instead: email_active /
     * phone_active mirror email/phone only while deleted_at IS NULL, and
     * evaluate to NULL (excluded from a unique index, same as any other
     * NULL) once the row is soft-deleted or was never active. Uniqueness
     * is enforced by the database on the generated column, not the app.
     */
    public function up(): void
    {
        Schema::table('users', function ($table) {
            $table->softDeletes();
        });

        $driver = DB::getDriverName();

        Schema::table('users', function ($table) {
            $table->dropUnique('users_email_unique');
            $table->dropUnique('users_phone_unique');
        });

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users ADD COLUMN email_active VARCHAR(255) GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN email ELSE NULL END) VIRTUAL");
            DB::statement("ALTER TABLE users ADD COLUMN phone_active VARCHAR(20) GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN phone ELSE NULL END) VIRTUAL");
            DB::statement("ALTER TABLE users ADD UNIQUE INDEX users_email_active_unique (email_active)");
            DB::statement("ALTER TABLE users ADD UNIQUE INDEX users_phone_active_unique (phone_active)");
        } elseif ($driver === 'sqlite') {
            DB::statement("ALTER TABLE users ADD COLUMN email_active TEXT GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN email ELSE NULL END) VIRTUAL");
            DB::statement("ALTER TABLE users ADD COLUMN phone_active TEXT GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN phone ELSE NULL END) VIRTUAL");
            DB::statement("CREATE UNIQUE INDEX users_email_active_unique ON users(email_active)");
            DB::statement("CREATE UNIQUE INDEX users_phone_active_unique ON users(phone_active)");
        } else {
            throw new \RuntimeException("add_soft_deletes_to_users_table migration does not support the '{$driver}' driver - add generated-column DDL for it before running this migration.");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users DROP INDEX users_email_active_unique");
            DB::statement("ALTER TABLE users DROP INDEX users_phone_active_unique");
            DB::statement("ALTER TABLE users DROP COLUMN email_active");
            DB::statement("ALTER TABLE users DROP COLUMN phone_active");
        } elseif ($driver === 'sqlite') {
            DB::statement("DROP INDEX IF EXISTS users_email_active_unique");
            DB::statement("DROP INDEX IF EXISTS users_phone_active_unique");
            DB::statement("ALTER TABLE users DROP COLUMN email_active");
            DB::statement("ALTER TABLE users DROP COLUMN phone_active");
        }

        Schema::table('users', function ($table) {
            $table->unique('email');
            $table->unique('phone');
        });

        Schema::table('users', function ($table) {
            $table->dropSoftDeletes();
        });
    }
};
