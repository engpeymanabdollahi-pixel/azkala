<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 15, 2); // درصد یا مبلغ
            $table->decimal('min_order_amount', 15, 2)->default(0); // حداقل مبلغ سفارش
            $table->decimal('max_discount', 15, 2)->nullable(); // حداکثر تخفیف (برای درصدی)
            $table->integer('usage_limit')->nullable(); // محدودیت کلی
            $table->integer('usage_limit_per_user')->default(1); // محدودیت هر کاربر
            $table->integer('used_count')->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('description')->nullable();
            $table->enum('applicable_to', ['all', 'categories', 'brands', 'products'])->default('all');
            $table->json('applicable_ids')->nullable(); // IDs دسته/برند/محصول
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('is_active');
            $table->index(['start_date', 'end_date']);
        });

        // جدول pivot برای ردیابی استفاده کاربران
        Schema::create('coupon_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('discount_amount', 15, 2);
            $table->timestamps();

            $table->unique(['coupon_id', 'user_id', 'order_id']);
            $table->index(['user_id', 'coupon_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_user');
        Schema::dropIfExists('coupons');
    }
};