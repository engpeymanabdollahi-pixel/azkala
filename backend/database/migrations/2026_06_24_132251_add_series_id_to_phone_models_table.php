<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('phone_models', function (Blueprint $table) {
            $table->foreignId('series_id')
                  ->nullable()
                  ->after('brand_id')
                  ->constrained('phone_series')
                  ->nullOnDelete();
            
            $table->integer('release_year')->nullable()->after('image');
            $table->string('screen_size')->nullable();
            $table->string('weight')->nullable();
            $table->integer('compatible_products_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('phone_models', function (Blueprint $table) {
            $table->dropForeign(['series_id']);
            $table->dropColumn([
                'series_id',
                'release_year',
                'screen_size',
                'weight',
                'compatible_products_count'
            ]);
        });
    }
};