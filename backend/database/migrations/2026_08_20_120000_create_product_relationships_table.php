<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ✅ Product Relationship — فاز ۳ (Phase 2 audit → GO محدود به complement).
//
// این جدول عمداً کاملاً مستقل از سازگاری دستگاه (device_model_product) است:
// «مکمل» یعنی «این محصول را هم پیشنهاد بده» (مثلاً شارژر برای گوشی)، نه
// «این محصول با فلان دستگاه کار می‌کند». طبق Phase 2 audit این پروژه، فقط
// نوع complement توجیه دارد (similar را getRelatedProducts پویا از قبل
// پوشش می‌دهد؛ bundle معنای تجاری/قیمتی جدا دارد و عمداً از این جدول بیرون
// نگه داشته شده؛ alternative بدون شاهد نیاز واقعی اضافه نشد).
//
// جهت‌دار عمدی: (A,B) به‌معنای «B مکمل A است»، نه برعکس — رابطه‌ی معکوس اگر
// لازم باشد باید صریحاً یک ردیف جدا ساخته شود، خودکار استنتاج نمی‌شود.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('target_product_id')->constrained('products')->cascadeOnDelete();
            // ✅ عمداً یک ستون رشته‌ای ساده، نه enum بسته‌ی DB-level —
            // دقیقاً همان الگوی device_brands.type قبلی؛ اعتبارسنجی واقعی
            // (فقط 'complement' مجاز است در V1) در لایه‌ی Service است، نه DB.
            $table->string('type', 20)->default('complement');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // ✅ جلوگیری از رابطه‌ی تکراریِ دقیقاً هم‌نوع بین همان دو محصول.
            // منع self-reference (source == target) در لایه‌ی Service اعمال
            // می‌شود — دقیقاً همان الگوی این پروژه برای این کلاس قید (نه یک
            // CHECK خام SQLite، طبق قرارداد مستندشده در فازهای قبلی).
            $table->unique(['source_product_id', 'target_product_id', 'type'], 'product_relationships_unique');
            $table->index('target_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_relationships');
    }
};
