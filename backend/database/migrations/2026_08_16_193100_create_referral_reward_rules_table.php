<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Referral Reward Rule Engine (Part 4 audit).
     *
     * سیستم قبلی فقط یک مبلغ ثابت (Setting: referral_reward_amount) داشت
     * که روی *اولین* سفارش موفق کاربر معرفی‌شده اجرا می‌شد (رجوع به
     * ReferralRewardService::qualifyAndRewardForCompletedOrder — این
     * منطق دست‌نخورده می‌ماند، مستقل از این جدول است).
     *
     * این جدول یک لایه‌ی *اضافه* روی همان سیستم است: پاداش‌های سطحی
     * (milestone) بر مبنای تعداد کل «معرفی موفق» یک معرف — یعنی تعداد
     * ردیف‌های Referral با status=rewarded برای همان referrer_user_id
     * (دقیقاً همان چیزی که Part 4 پرسیده «successful referral یعنی
     * چه» — پاسخ: دقیقاً همین وضعیت).
     *
     * ✅ REUSE، نه دوباره‌سازی: reward_type=fixed_coupon/percentage_coupon
     * از همان مدل Coupon موجود (کاملاً کامل: min_order_amount،
     * max_discount، usage_limit، expiration) یک کوپن واقعی می‌سازد.
     * reward_type=fixed_credit از همان الگوی حسابداریِ referral_rewards
     * پیروی می‌کند ولی چون آن جدول unique(referral_id) دارد (یعنی «حداکثر
     * یک پاداش برای هر Referral») و پاداش milestone به‌ازای *معرف*، نه
     * یک Referral خاص، محاسبه می‌شود، نمی‌تواند همان جدول را reuse کند
     * بدون شکستن آن تضمین — به‌جایش مبلغ مستقیم در ردیف
     * referral_rule_triggers (migration بعدی) ثبت می‌شود.
     *
     * ⚠️ هیچ نوع «کیف پول» یا «سیستم کوپن دوم» ساخته نشد — دقیقاً طبق
     * دستور صریح تسک. free_shipping/bonus_points عمداً پیاده نشدند: نه
     * concept «هزینه‌ی ارسال» جدا در Coupon وجود دارد، نه سیستم امتیاز —
     * طبق همان دستور («custom reward type only if the existing
     * architecture supports it»).
     */
    public function up(): void
    {
        Schema::create('referral_reward_rules', function (Blueprint $table) {
            $table->id();

            // تعداد معرفی موفق لازم برای رسیدن به این سطح.
            $table->unsignedInteger('milestone');

            $table->enum('reward_type', ['fixed_credit', 'fixed_coupon', 'percentage_coupon']);

            // مبلغ (تومان) برای fixed_credit/fixed_coupon، یا درصد برای percentage_coupon.
            $table->decimal('reward_value', 12, 2);

            // فقط برای انواع کوپنی معنا دارد — همان فیلدهای واقعی مدل Coupon.
            $table->decimal('min_order_amount', 12, 2)->nullable();
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->unsignedInteger('coupon_expiration_days')->nullable();
            $table->unsignedInteger('usage_limit')->default(1);

            // false (پیش‌فرض) = یک‌بار برای کل عمر معرف («وقتی به ۱۰
            // معرفی موفق رسید»). true = هر بار که تعداد به مضربی از
            // milestone برسد («هر ۱۰ معرفی یک‌بار»، تکرارشونده).
            $table->boolean('repeatable')->default(false);

            $table->unsignedInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->string('description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // یک قانون به‌ازای هر milestone — از تعریف دو قانون متناقض
            // برای همان آستانه جلوگیری می‌کند (ابهام در اولویت).
            $table->unique('milestone');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_reward_rules');
    }
};
