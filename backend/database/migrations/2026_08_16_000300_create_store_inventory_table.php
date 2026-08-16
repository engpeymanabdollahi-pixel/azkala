<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * موجودی فیزیکی هر محصول در هر فروشگاه — کاملاً مستقل از
     * products.stock (که طبق Verification Gate این تسک، «موجودی
     * آنلاین/قابل‌فروش فوری» است، decrement می‌شود لحظه‌ی ثبت سفارش
     * آنلاین). این استخر کاملاً جداست؛ هیچ کد موجودی
     * (OrderService/AdminProductService/...) هرگز این جدول را
     * نمی‌خواند یا نمی‌نویسد — پس هیچ ناسازگاری با منطق موجود ایجاد
     * نمی‌شود.
     *
     * ⚠️ عمداً بدون قیمت جداگانه در این فاز (طبق دستور صریح Phase 3):
     * قیمت همچنان از products.price/discount_price خوانده می‌شود.
     */
    public function up(): void
    {
        Schema::create('store_inventory', function (Blueprint $table) {
            $table->id();

            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            // ✅ unsignedInteger (نه integer ساده مثل products.stock):
            // چون این یک جدول کاملاً جدید است (نه گسترش چیزی موجود)،
            // محدودیت >= 0 در همین سطح دیتابیس هم اعمال می‌شود —
            // یک لایه‌ی دفاعی اضافه، مستقل از اعتبارسنجی سطح
            // StoreInventoryService.
            $table->unsignedInteger('stock')->default(0);

            $table->boolean('pickup_enabled')->default(true);

            $table->timestamps();

            $table->unique(['store_id', 'product_id']);
            $table->index(['product_id', 'stock']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_inventory');
    }
};
