<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ✅ اصلاح حیاتی: user_devices.phone_model_id قبلاً به جدول phone_models
 * ارجاع می‌داد — جدولی که هیچ seeder ای پرش نمی‌کند (کاملاً خالی). در
 * همین حال، سیستم سازگاریِ واقعیِ محصولات (Product::deviceModels،
 * رابطه‌ی device_model_product) به device_models وصل است. یعنی ویژگی
 * «دستگاه‌های من» حتی اگر لیست برندها را هم می‌دید، هیچ‌وقت با محصولات
 * واقعی مچ نمی‌شد — دو سیستم موازی و ناسازگار.
 *
 * این مهاجرت کلید خارجی phone_model_id را از phone_models به device_models
 * منتقل می‌کند (نام ستون همان می‌ماند تا هیچ کد دیگری که این نام را
 * می‌شناسد نشکند).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            $table->dropForeign(['phone_model_id']);
        });

        Schema::table('user_devices', function (Blueprint $table) {
            $table->foreign('phone_model_id')
                ->references('id')->on('device_models')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            $table->dropForeign(['phone_model_id']);
        });

        Schema::table('user_devices', function (Blueprint $table) {
            $table->foreign('phone_model_id')
                ->references('id')->on('phone_models')
                ->cascadeOnDelete();
        });
    }
};
