<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Not replaced with unique(slug, deleted_at): MySQL/SQLite/Postgres
        // treat NULL as distinct from NULL in unique indexes, so that
        // compound index would stop catching duplicate *active* slugs
        // (deleted_at IS NULL on every active row) - verified empirically
        // against this app's SQLite driver. Slug uniqueness among active
        // brands is enforced at the validation layer in
        // AdminBrandController (Rule::unique(...)->whereNull('deleted_at')).
        Schema::table('brands', function (Blueprint $table) {
            $table->dropUnique(['slug']);
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->unique(['slug']);
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
