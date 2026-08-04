<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('device_brands', function (Blueprint $table) {
            if (!Schema::hasColumn('device_brands', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('slug');
            }
        });

        Schema::table('device_series', function (Blueprint $table) {
            if (!Schema::hasColumn('device_series', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('slug');
            }
        });

        Schema::table('device_models', function (Blueprint $table) {
            if (!Schema::hasColumn('device_models', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('slug');
            }
        });
    }

    public function down(): void
    {
        Schema::table('device_brands', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
        Schema::table('device_series', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
        Schema::table('device_models', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};