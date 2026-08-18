<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // ✅ Variant / Color System فاز ۲.۱: رنگ first-class می‌ماند
            // (color_name/color_code)، نه یک جدول attribute عمومی —
            // دقیقاً طبق دستور صریح تسک. attributes فقط برای توسعه‌ی
            // آینده (سایز و غیره) رزرو شده، بدون هیچ سیستم مدیریتی روی آن
            // در همین فاز.
            $table->string('color_name')->nullable();
            $table->string('color_code')->nullable();

            // ✅ همان قراردادِ واقعی products.sku: یکتایی سراسری، نه فقط
            // در محدوده‌ی یک محصول (تأیید شده با خواندن مستقیم
            // create_products_table.php: ->unique()->nullable()، بدون
            // هیچ scope دیگری). اینجا هم عیناً همان الگو تکرار شده، نه یک
            // قرارداد تازه.
            $table->string('sku')->unique()->nullable();

            // ✅ دقیقاً همان دقت اعشاری فعلی products (بعد از migration
            // change_price_columns_to_decimal که price/compare_price/
            // discount_price را به decimal(15,4) تغییر داد — همان چیزی که
            // Product::$casts هم امروز واقعاً دارد؛ decimal(15,2) اولیه‌ی
            // create_products_table دیگر مقدار واقعی جاری نیست).
            $table->decimal('price', 15, 4)->nullable();
            $table->decimal('compare_price', 15, 4)->nullable();
            $table->decimal('discount_price', 15, 4)->nullable();

            $table->integer('stock')->default(0);
            $table->string('image')->nullable();
            $table->json('attributes')->nullable();

            $table->timestamps();
            // ✅ هم‌راستا با الگوی Product/Brand در همین ریپو: SoftDeletes
            // اینجا اضافه شد تا وقتی فازهای بعدی (سبد/سفارش) به variant_id
            // ارجاع بدهند، حذف یک رنگ رکورد سفارش‌های قبلی را نشکند — بدون
            // اینکه هیچ رفتار فعلی‌ای عوض شود (این جدول امروز توسط هیچ
            // جدول دیگری ارجاع داده نمی‌شود).
            $table->softDeletes();

            // ✅ فقط ایندکسی که واقعاً لازم است: تمام کوئری‌های واقعی این
            // فاز (Product::variants()، sync در SellerService) بر اساس
            // product_id فیلتر می‌کنند. ایندکس حدسی دیگری اضافه نشد.
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
