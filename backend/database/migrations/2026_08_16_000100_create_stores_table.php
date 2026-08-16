<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Nearby Physical Stores — Phase: Discovery + Inventory (بدون Pickup).
     *
     * ✅ کاملاً additive: هیچ تغییری روی users/products/orders/addresses
     * اعمال نشد (طبق نتیجه‌ی Verification Gate — هیچ‌کدام مفهوم مکان
     * فیزیکی نداشتند، پس چیزی برای «گسترش» وجود نداشت که نیاز به تغییر
     * schema موجود داشته باشد).
     *
     * seller_id → users.id (nullOnDelete، نه cascade) — دقیقاً همان الگوی
     * admin_access_logs/referrals این پروژه: حذف کاربر نباید تاریخچه/
     * رکوردهای مرتبط را نابود کند.
     *
     * latitude/longitude عمداً nullable هستند: طبق طراحی UI درخواستی
     * (Phase 3)، فروشنده ممکن است یک فروشگاه را در حالت پیش‌نویس بدون
     * مختصات دقیق بسازد و بعداً تکمیل کند؛ فیلتر نمایش عمومی
     * (NearbyStoreService) هر دو ستون را NOT NULL می‌خواهد، پس یک
     * فروشگاه بدون مختصات هرگز در جستجوی «نزدیک من» ظاهر نمی‌شود — بدون
     * نیاز به یک ستون boolean اضافه.
     *
     * decimal(10,7) برای latitude/longitude: دقت استاندارد GPS
     * (~۱ سانتی‌متر) — همان دقتی که Google/OSM معمولاً برای مختصات
     * پیشنهاد می‌کنند؛ بیشتر از این بی‌معنی و کمتر از این برای فاصله‌ی
     * «۸۰۰ متری» واقعاً محسوس/گمراه‌کننده است.
     */
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();

            // ✅ nullable + nullOnDelete: دقیقاً همان قرارداد موجود
            // products.seller_id در همین پروژه (نه یک تصمیم جدید) — اگر
            // کاربر seller حذف شود، ردیف store به‌جای شکستن سخت FK باقی
            // می‌ماند اما seller_id=NULL؛ NearbyStoreService و
            // StoreService هر دو صریحاً چنین ردیف‌هایی را نادیده
            // می‌گیرند (نه قابل مدیریت توسط هیچ فروشنده‌ای، نه قابل
            // نمایش عمومی).
            $table->foreignId('seller_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // ✅ فروشنده می‌تواند فروشگاه را موقتاً غیرفعال کند (is_active)،
            // مستقل از verified_at (که فقط ادمین کنترلش می‌کند، §16) —
            // نمایش عمومی به هر دو نیاز دارد: فعال بودن *و* تأیید بودن.
            $table->boolean('is_active')->default(true);
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('seller_id');
            $table->index(['latitude', 'longitude']);
            $table->index(['is_active', 'verified_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
