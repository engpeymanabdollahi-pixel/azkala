<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * لجر «این معرف دقیقاً چه زمانی به کدام سطح رسید» — Referral Rule
     * Engine (Part 4 audit).
     *
     * دو نقش دارد:
     *  ۱. تاریخچه‌ی واقعی برای نمایش در پنل ادمین (نه یک محاسبه‌ی دوباره
     *     هر بار).
     *  ۲. تضمین idempotency در برابر duplicate: هر ترکیب
     *     (rule, referrer, successful_referrals_count_at_trigger) دقیقاً
     *     یک‌بار می‌تواند وجود داشته باشد — چه برای قوانین یک‌بارمصرف
     *     (که همیشه همان یک count را دارند) چه تکرارشونده (که هر مضرب
     *     جدید یک count متفاوت است، پس ردیف جدید مجاز است ولی صدا زدن
     *     دوباره‌ی engine برای همان count دقیقاً همان ردیف را می‌بیند و
     *     رد می‌شود).
     */
    public function up(): void
    {
        Schema::create('referral_rule_triggers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('referral_reward_rule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referrer_user_id')->constrained('users')->cascadeOnDelete();

            $table->unsignedInteger('successful_referrals_count_at_trigger');

            // Snapshot صریح نوع/مبلغ پاداش در لحظه‌ی trigger — حتی اگر
            // بعداً ادمین خودِ قانون را ویرایش/حذف کند، تاریخچه دست‌نخورده
            // می‌ماند (همان فلسفه‌ی referrer_user_id در referral_rewards).
            $table->string('reward_type');
            $table->decimal('reward_value', 12, 2);

            // فقط وقتی نوع پاداش کوپنی بوده پر می‌شود.
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();

            $table->unique(
                ['referral_reward_rule_id', 'referrer_user_id', 'successful_referrals_count_at_trigger'],
                'referral_rule_triggers_unique_firing'
            );
            $table->index('referrer_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_rule_triggers');
    }
};
