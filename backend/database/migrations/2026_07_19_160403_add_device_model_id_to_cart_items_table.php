<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (!Schema::hasColumn('cart_items', 'device_model_id')) {
                $table->unsignedBigInteger('device_model_id')->nullable()->after('price');
                
                $table->foreign('device_model_id')
                      ->references('id')
                      ->on('device_models')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (Schema::hasColumn('cart_items', 'device_model_id')) {
                $table->dropForeign(['device_model_id']);
                $table->dropColumn('device_model_id');
            }
        });
    }
};