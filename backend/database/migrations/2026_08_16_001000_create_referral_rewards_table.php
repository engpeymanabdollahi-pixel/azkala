<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Referral System — Phase 3 (Reward Ledger).
     *
     * این جدول یک لجر مالی اختصاصی و قابل‌ممیزی برای پاداش معرفی است —
     * دقیقاً هم‌راستا با seller_transactions (که یک لجر مشابه، ولی برای
     * پول فروشنده است)، اما کاملاً مستقل از آن: هیچ ردیفی از این جدول
     * هرگز wallet_balance یا seller_transactions را لمس نمی‌کند (رجوع
     * به کامنت ReferralRewardService). هیچ کیف پول قابل‌خرج‌کردن مشتری
     * در این فاز ساخته نمی‌شود — این فقط یک رکورد حسابداریِ «این
     * Referral چه زمانی، چقدر، و برای کدام سفارش پاداش گرفت».
     *
     * ✅ تضمین سطح-دیتابیس «حداکثر یک پاداش برای هر Referral»:
     * unique(referral_id) — تنها تضمین واقعی در برابر race condition دو
     * درخواست هم‌زمان (مثلاً دو تغییر وضعیت سفارش هم‌زمان)، دقیقاً همان
     * الگویی که referrals.referred_user_id (unique) قبلاً برای مسئله‌ی
     * مشابه استفاده کرده.
     *
     * ✅ unique(order_id) دفاع اضافه: همان سفارشِ صلاحیت‌دار هرگز دو ردیف
     * پاداش نمی‌سازد (حتی اگر منطق سرویس به هر دلیلی دوبار برای همان
     * سفارش صدا زده شود). nullable چون از همان الگوی
     * seller_transactions.order_id (nullable + nullOnDelete) پیروی
     * می‌کند — ستون‌های unique در MySQL/SQLite چند NULL را مجاز می‌دانند،
     * پس این با نبودِ order_id در سناریوهای فرضی آینده تداخل ندارد.
     *
     * type/status عمداً enum هستند (نه رشته‌ی آزاد) — همان قراردادِ
     * orders.status/payment_status و referrals.status در این پروژه.
     * 'reversed' امروز توسط هیچ کدی set نمی‌شود؛ فقط جای رشد (بازپس‌گیری
     * دستی ادمین در فازی بعدی) را بدون نیاز به migration جدید باز
     * نگه می‌دارد — دقیقاً همان فلسفه‌ی enum جدول referrals.
     */
    public function up(): void
    {
        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();

            // یک Referral حداکثر یک پاداش دارد — رجوع به توضیح unique پایین.
            $table->foreignId('referral_id')->constrained('referrals')->cascadeOnDelete();

            // Snapshot صریح معرف — حتی اگر رابطه‌ی referral_id هم همین را
            // می‌دهد، ذخیره‌ی مستقیم این ستون فیلتر/گزارش‌گیری ادمین
            // (Phase 10) را بدون join همیشگی ساده می‌کند. nullOnDelete
            // دقیقاً هم‌راستا با referrals.referrer_user_id.
            $table->foreignId('referrer_user_id')->nullable()->constrained('users')->nullOnDelete();

            // سفارشِ صلاحیت‌دار (اولین completed/delivered کاربر معرفی‌شده).
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            // هم‌راستا با seller_transactions.amount (decimal(12,2) —
            // قرارداد مبلغیِ این پروژه برای رکوردهای «تراکنش/لجر»، نه
            // decimal(15,4) که فقط برای قیمت خودِ محصول/سفارش است).
            $table->decimal('amount', 12, 2);

            $table->enum('type', ['fixed_credit'])->default('fixed_credit');
            $table->enum('status', ['granted', 'reversed'])->default('granted');

            $table->timestamp('rewarded_at');

            $table->timestamps();

            $table->unique('referral_id');
            $table->unique('order_id');
            $table->index('referrer_user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_rewards');
    }
};
