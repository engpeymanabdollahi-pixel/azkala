<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->string('field'); // 'price' یا 'stock'
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->timestamps();
            
            // ایندکس برای سرعت بالا در کوئری‌های فروشنده
            $table->index(['seller_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_histories');
    }
};