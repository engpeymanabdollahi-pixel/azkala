<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ✅ Device-First Architecture — Phase 1J/1K: پاکسازی دو مکانیزم موازیِ
// سازگاری محصول↔دستگاه که قبلاً کنار device_model_product (تنها منبع
// حقیقتِ فعلی) وجود داشتند:
//
//   ۱. جدول product_device_compatibility — قبل از این فاز فقط در
//      CartService::addItem خوانده می‌شد، ولی هیچ‌جای seller/admin هرگز
//      آن را نمی‌نوشت (همیشه خالی بود؛ عملاً یک چک سازگاری همیشه‌شکست‌خورده).
//      CartService اکنون از device_model_product می‌خواند.
//   ۲. ستون products.device_model_id — یک رابطه‌ی تکی موازیِ pivot
//      چندبه‌چند device_model_product. تنها نویسنده‌ی واقعی‌اش
//      (BulkProductService) اکنون به‌جای این ستون از deviceModels()->sync()
//      استفاده می‌کند.
//
// این migration فقط بعد از global search کامل و صفر شدن ارجاعات کد اجرا
// می‌شود (طبق قانون صریح فاز ۱J: «Do NOT simply delete... before CartService
// is migrated» / «After global reference search confirms zero usage:
// remove»). در محیط فعلی هر دو مخزن صفر ردیف داشتند (تایید‌شده در فاز ۰) —
// یعنی هیچ داده‌ای برای مهاجرت وجود نداشت؛ down() برای بازگشت‌پذیری کامل
// است.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'device_model_id')) {
                $table->dropForeign(['device_model_id']);
                $table->dropColumn('device_model_id');
            }
        });

        Schema::dropIfExists('product_device_compatibility');
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'device_model_id')) {
                $table->unsignedBigInteger('device_model_id')->nullable()->after('brand_id');
                if (Schema::hasTable('device_models')) {
                    $table->foreign('device_model_id')->references('id')->on('device_models')->onDelete('set null');
                }
            }
        });

        Schema::create('product_device_compatibility', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_model_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['product_id', 'device_model_id']);
        });
    }
};
