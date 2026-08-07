<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['restock', 'price_drop', 'target_price']);
            $table->decimal('target_price', 12, 2)->nullable(); // برای نوع target_price
            $table->decimal('original_price', 12, 2); // قیمت هنگام ایجاد آلرت
            $table->boolean('is_active')->default(true);
            $table->boolean('is_triggered')->default(false);
            $table->timestamp('triggered_at')->nullable();
            $table->json('channels')->default('["database","email"]');
            $table->timestamps();

            // یونیک بودن ترکیبی برای جلوگیری از آلرت تکراری
            $table->unique(['user_id', 'product_id', 'type'], 'unique_user_product_type');
            
            // ایندکس‌ها برای عملکرد بهتر
            $table->index(['is_active', 'type'], 'idx_active_type');
            $table->index('product_id', 'idx_product_id');
            $table->index('user_id', 'idx_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_alerts');
    }
};
