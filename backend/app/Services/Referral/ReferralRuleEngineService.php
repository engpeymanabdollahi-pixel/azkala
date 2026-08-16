<?php

namespace App\Services\Referral;

use App\Models\Coupon;
use App\Models\Notification;
use App\Models\Referral;
use App\Models\ReferralRewardRule;
use App\Models\ReferralRuleTrigger;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Referral Reward RULE ENGINE — Part 4 (لایه‌ی اضافه، مستقل از پاداش
 * ثابتِ هر-معرفی که ReferralRewardService از قبل مدیریت می‌کند).
 *
 * نقطه‌ی ورود واحد: evaluateAndTrigger($referrer) — همیشه *بعد* از این‌که
 * یک Referral واقعاً به status=rewarded رسید صدا زده می‌شود (رجوع به
 * hook در ReferralRewardService::qualifyAndRewardForCompletedOrder،
 * دقیقاً بعد از commit موفق پاداش پایه — همان الگوی نوتیفیکیشن آنجا).
 *
 * هرگز Exception پرتاب نمی‌کند — دقیقاً همان قرارداد
 * ReferralRewardService/processSellerPayouts: شکست این لایه‌ی جایزه‌ی
 * اضافه هرگز نباید خودِ پاداش پایه یا وضعیت سفارش را مختل کند.
 */
class ReferralRuleEngineService
{
    /**
     * «معرفی موفق» دقیقاً یعنی چه (پاسخ صریح به سؤال Part 4): تعداد
     * ردیف‌های Referral این معرف که status=rewarded دارند — یعنی همان
     * کاربرانی که هم عضو شدند، هم اولین سفارش صلاحیت‌دارشان را کامل
     * کردند، هم پاداش پایه‌شان واقعاً granted شد.
     */
    public function successfulReferralsCount(int $referrerUserId): int
    {
        return Referral::where('referrer_user_id', $referrerUserId)
            ->where('status', Referral::STATUS_REWARDED)
            ->count();
    }

    public function evaluateAndTrigger(User $referrer): void
    {
        try {
            $count = $this->successfulReferralsCount($referrer->id);

            $rules = ReferralRewardRule::query()
                ->valid()
                ->orderByDesc('priority')
                ->get()
                ->filter(fn (ReferralRewardRule $rule) => $rule->isEligibleFor($count));

            foreach ($rules as $rule) {
                $this->fireRule($rule, $referrer, $count);
            }
        } catch (\Throwable $e) {
            Log::error('[ReferralRuleEngine] خطا در ارزیابی قوانین پاداش: '.$e->getMessage(), [
                'referrer_user_id' => $referrer->id,
            ]);
        }
    }

    private function fireRule(ReferralRewardRule $rule, User $referrer, int $count): void
    {
        DB::beginTransaction();
        try {
            // ✅ idempotency واقعی: unique(rule, referrer, count) روی
            // خودِ جدول — نه فقط یک چک exists() قبل از insert (که همان
            // TOCTOU race ای دارد که در Part 2/Wishlist پیدا شد). این‌جا
            // مستقیم روی exception تکیه می‌کنیم، نه فقط چک از قبل.
            $couponId = null;

            if (in_array($rule->reward_type, [ReferralRewardRule::TYPE_FIXED_COUPON, ReferralRewardRule::TYPE_PERCENTAGE_COUPON], true)) {
                $couponId = $this->generateCoupon($rule, $referrer)->id;
            }

            $trigger = ReferralRuleTrigger::create([
                'referral_reward_rule_id' => $rule->id,
                'referrer_user_id' => $referrer->id,
                'successful_referrals_count_at_trigger' => $count,
                'reward_type' => $rule->reward_type,
                'reward_value' => $rule->reward_value,
                'coupon_id' => $couponId,
            ]);

            DB::commit();

            Log::info('[ReferralRuleEngine] قانون پاداش trigger شد.', [
                'rule_id' => $rule->id,
                'referrer_user_id' => $referrer->id,
                'count' => $count,
                'trigger_id' => $trigger->id,
            ]);

            $this->notify($rule, $referrer, $couponId);
        } catch (QueryException $e) {
            DB::rollBack();
            if ($this->isUniqueConstraintViolation($e)) {
                // یک صدازدن هم‌زمان دیگر همین (rule, referrer, count) را
                // قبلاً trigger کرده — idempotent، بی‌صدا نادیده گرفته می‌شود.
                return;
            }

            Log::error('[ReferralRuleEngine] خطای دیتابیس در trigger کردن قانون: '.$e->getMessage(), [
                'rule_id' => $rule->id, 'referrer_user_id' => $referrer->id,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('[ReferralRuleEngine] خطا در trigger کردن قانون: '.$e->getMessage(), [
                'rule_id' => $rule->id, 'referrer_user_id' => $referrer->id,
            ]);
        }
    }

    /**
     * ✅ REUSE مستقیم مدل Coupon موجود — هیچ سیستم کوپن دومی ساخته نشد.
     * کد به‌صورت تصادفی و یکتا تولید می‌شود و فقط برای همین معرف از طریق
     * نوتیفیکیشن ارسال می‌شود؛ Coupon فعلی مفهوم «مخصوص یک کاربر» ندارد
     * (فقط usage_limit_per_user بعد از استفاده)، پس این ساده‌ترین راه
     * امن بدون دست‌بردن در معماری کوپن است.
     */
    private function generateCoupon(ReferralRewardRule $rule, User $referrer): Coupon
    {
        return Coupon::create([
            'code' => $this->generateUniqueCouponCode(),
            'type' => $rule->reward_type === ReferralRewardRule::TYPE_PERCENTAGE_COUPON ? 'percentage' : 'fixed',
            'value' => $rule->reward_value,
            'min_order_amount' => $rule->min_order_amount ?? 0,
            'max_discount' => $rule->max_discount,
            'usage_limit' => $rule->usage_limit,
            'usage_limit_per_user' => 1,
            'start_date' => now(),
            'end_date' => $rule->coupon_expiration_days ? now()->addDays($rule->coupon_expiration_days) : null,
            'is_active' => true,
            'description' => "پاداش معرفی — رسیدن به {$rule->milestone} معرفی موفق (کاربر #{$referrer->id})",
            'applicable_to' => 'all',
        ]);
    }

    private function generateUniqueCouponCode(): string
    {
        do {
            $code = 'REF-'.strtoupper(Str::random(8));
        } while (Coupon::where('code', $code)->exists());

        return $code;
    }

    /**
     * ✅ همان الگوی Notification::create مستقیم که
     * ReferralRewardService/AdminUserService از قبل استفاده می‌کنند —
     * نه یک ساب‌سیستم جدید. جدا از تراکنش اصلی (بعد از commit موفق) تا
     * شکست نوتیفیکیشن هرگز trigger شدن واقعیِ پاداش را نامعتبر نکند.
     */
    private function notify(ReferralRewardRule $rule, User $referrer, ?int $couponId): void
    {
        try {
            $message = match ($rule->reward_type) {
                ReferralRewardRule::TYPE_FIXED_CREDIT => 'شما به دلیل رسیدن به '.$rule->milestone.' معرفی موفق، مبلغ '
                    .number_format((float) $rule->reward_value).' تومان اعتبار پاداش دریافت کردید.',
                ReferralRewardRule::TYPE_FIXED_COUPON => 'شما به دلیل رسیدن به '.$rule->milestone.' معرفی موفق، یک کد تخفیف '
                    .number_format((float) $rule->reward_value).' تومانی دریافت کردید.',
                ReferralRewardRule::TYPE_PERCENTAGE_COUPON => 'شما به دلیل رسیدن به '.$rule->milestone.' معرفی موفق، یک کد تخفیف '
                    .rtrim(rtrim(number_format((float) $rule->reward_value, 2), '0'), '.').'٪ دریافت کردید.',
                default => 'شما یک پاداش معرفی جدید دریافت کردید.',
            };

            if ($couponId) {
                $coupon = Coupon::find($couponId);
                if ($coupon) {
                    $message .= ' کد: '.$coupon->code;
                }
            }

            Notification::create([
                'user_id' => $referrer->id,
                'type' => 'referral_milestone_reward_earned',
                'title' => 'رسیدن به یک سطح جدید پاداش معرفی!',
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            Log::warning('[ReferralRuleEngine] ثبت نوتیفیکیشن پاداش سطحی ناموفق بود: '.$e->getMessage());
        }
    }

    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        return $e->getCode() === '23000';
    }
}
