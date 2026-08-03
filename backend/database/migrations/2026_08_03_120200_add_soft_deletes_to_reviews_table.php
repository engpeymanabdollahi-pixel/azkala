<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Drop the plain unique(user_id, product_id) pair. A compound
        // unique(user_id, product_id, deleted_at) looks like the fix, but
        // MySQL/SQLite/Postgres all treat NULL as distinct from NULL in
        // unique indexes, so two *active* rows (deleted_at IS NULL) with
        // the same user_id/product_id would silently stop colliding -
        // verified empirically against this app's SQLite driver before
        // writing this migration. Duplicate-review prevention for active
        // reviews is already enforced in ReviewService::createReview()
        // (an Eloquent query, which respects the SoftDeletes global scope
        // and correctly excludes soft-deleted rows).
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->unique(['user_id', 'product_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
