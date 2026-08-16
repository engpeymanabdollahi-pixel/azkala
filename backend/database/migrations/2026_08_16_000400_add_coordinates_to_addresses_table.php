<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * مختصات اختیاری برای آدرس‌های ذخیره‌شده‌ی کاربر — Nearby Stores
     * Completion Phase (تکمیل «فروشگاه‌های نزدیک»، نه Checkout).
     *
     * ✅ کاملاً افزایشی و nullable — هیچ آدرس موجودی تغییر نمی‌کند، و
     * هیچ رفتار موجودی (Checkout/Order/AddressService) نمی‌شکند، چون
     * Checkout هرگز از جدول addresses نمی‌خواند (فرم شخصی‌سازی‌شده‌ی
     * خودش را دارد — رجوع به CheckoutForm.tsx) و AddressService::
     * createAddress() یک allowlist صریح است، نه یک mass-assignment خام.
     *
     * تنها مصرف‌کننده‌ی این دو ستون: NearbyStores.tsx (سمت فرانت‌اند) —
     * وقتی کاربر صریحاً «استفاده از آدرس ذخیره‌شده» را برای جستجوی
     * «فروشگاه‌های نزدیک» انتخاب می‌کند.
     */
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('postal_code');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
