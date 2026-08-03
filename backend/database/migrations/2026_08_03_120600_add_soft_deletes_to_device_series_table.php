<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('device_series', function (Blueprint $table) {
            $table->softDeletes();
        });

        // See the brands-table migration for why this isn't
        // unique(slug, deleted_at). Enforced at the validation layer in
        // AdminDeviceSeriesController (Rule::unique(...)->whereNull('deleted_at')).
        Schema::table('device_series', function (Blueprint $table) {
            $table->dropUnique(['slug']);
        });
    }

    public function down(): void
    {
        Schema::table('device_series', function (Blueprint $table) {
            $table->unique(['slug']);
        });

        Schema::table('device_series', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
