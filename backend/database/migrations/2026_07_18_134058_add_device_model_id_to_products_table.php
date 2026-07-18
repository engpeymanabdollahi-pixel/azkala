<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'device_model_id')) {
                $table->unsignedBigInteger('device_model_id')->nullable()->after('brand_id');
                
                // اضافه کردن foreign key فقط اگر جدول device_models وجود دارد
                if (Schema::hasTable('device_models')) {
                    $table->foreign('device_model_id')
                          ->references('id')
                          ->on('device_models')
                          ->onDelete('set null');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'device_model_id')) {
                $table->dropForeign(['device_model_id']);
                $table->dropColumn('device_model_id');
            }
        });
    }
};