<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('compare_price')->nullable()->after('price');
            $table->boolean('is_bestseller')->default(false)->after('is_active');
            $table->string('specifications')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['compare_price', 'is_bestseller', 'specifications']);
        });
    }
};