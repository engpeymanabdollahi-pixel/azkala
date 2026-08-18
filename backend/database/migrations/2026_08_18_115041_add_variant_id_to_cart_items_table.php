<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Variant/Color System فاز ۳: پایه‌ی سبد خرید variant-aware.
 *
 * ✅ محدودیت واقعی قبلی: unique(['cart_id', 'product_id']) — یعنی هر
 * محصول فقط یک ردیف در هر سبد می‌توانست داشته باشد. با ورود variant،
 * این محدودیت باید یک محصول با دو رنگ مختلف را دو ردیف جدا بداند، ولی
 * همچنان یک محصول بدون رنگ (legacy) را فقط یک ردیف.
 *
 * ⚠️ نکته‌ی حیاتی NULL: در SQLite/MySQL/Postgres، یک UNIQUE index چند
 * ستونی، NULL را «متفاوت از هر NULL دیگر» می‌داند (رفتار استاندارد SQL)
 * — یعنی unique(['cart_id','product_id','variant_id']) به‌تنهایی
 * نمی‌تواند جلوی دو ردیف legacy (هر دو با variant_id=NULL) برای همان
 * محصول در همان سبد را بگیرد. به همین دلیل، دفاع اصلیِ سناریوی legacy در
 * سطح اپلیکیشن (CartService::addItem، جستجوی صریح قبل از insert، داخل
 * DB::transaction) پیاده شده، نه فقط در سطح دیتابیس. این محدودیت سه‌ستونی
 * دفاع دوم (defense-in-depth) برای سناریوی واقعاً variant-دار است — آنجا
 * variant_id یک مقدار واقعی و غیر-NULL است، پس این index دقیقاً همان
 * تضمینی که برای محصولات ساده قبلاً وجود داشت را برای هر رنگ هم می‌دهد.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('variant_id')
                ->nullable()
                ->after('product_id')
                ->constrained('product_variants')
                ->nullOnDelete();
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique(['cart_id', 'product_id']);
            $table->unique(['cart_id', 'product_id', 'variant_id']);
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique(['cart_id', 'product_id', 'variant_id']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('variant_id');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->unique(['cart_id', 'product_id']);
        });
    }
};
