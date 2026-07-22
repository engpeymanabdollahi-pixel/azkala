<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * تغییر نوع ستون‌های قیمت از float به decimal برای دقت مالی
     */
    public function up(): void
    {
        // جدول products
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price', 15, 4)->change();
            $table->decimal('compare_price', 15, 4)->nullable()->change();
            $table->decimal('discount_price', 15, 4)->nullable()->change();
        });

        // جدول order_items
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('price', 15, 4)->change();
            $table->decimal('total', 15, 4)->change();
        });

        // جدول orders
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('subtotal', 15, 4)->change();
            $table->decimal('tax', 15, 4)->change();
            $table->decimal('shipping', 15, 4)->change();
            $table->decimal('discount', 15, 4)->change();
            $table->decimal('total', 15, 4)->change();
        });
    }

    /**
     * بازگشت به حالت قبلی (در صورت نیاز)
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->float('price')->change();
            $table->float('compare_price')->nullable()->change();
            $table->float('discount_price')->nullable()->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->float('price')->change();
            $table->float('total')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->float('subtotal')->change();
            $table->float('tax')->change();
            $table->float('shipping')->change();
            $table->float('discount')->change();
            $table->float('total')->change();
        });
    }
};