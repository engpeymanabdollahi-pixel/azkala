<?php

namespace App\Services\Referral;

use App\Models\Order;
use App\Models\Referral;
use App\Models\ReferralReward;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Referral System — Phase 3 (Qualification → Reward Ledger).
 *
 * این سرویس عمداً از ReferralService جدا است: ReferralService فقط
 * attribution (کد/capture/pending) را مدیریت می‌کند و هرگز نباید pool
 * پول را لمس کند؛ این سرویس فقط زمانی که یک سفارش واقعاً به وضعیت
 * نهاییِ موجود این پروژه (completed/delivered) می‌رسد صدا زده می‌شود
 * (از AdminOrderService::updateStatus — دقیقاً همان نقطه‌ای که
 * processSellerPayouts trigger می‌شود؛ رجوع به کامنت آنجا).
 *
 * ⚠️ عمداً payment_status='paid' معیار trigger نیست — این پروژه هیچ
 * gateway/callback پرداخت واقعی ندارد؛ payment_status فقط دستی و
 * بی‌اثر از پنل ادمین تغییر می‌کند (رجوع به Audit فاز قبل). تنها
 * لحظه‌ی «نهایی بودن واقعی» در کل کدبیس همان completed/delivered
 * سفارش است — دقیقاً همان چیزی که Payout فروشنده هم رویش سوار است.
 */
class ReferralRewardService
{
    private const QUALIFYING_STATUSES = ['completed', 'delivered'];

    /**
     * نقطه‌ی ورود واحد. Idempotent و safe-to-call-repeatedly: صدا زدن
     * دوباره برای همان سفارش (یا هر سفارش دیگر همان کاربر، بعد از
     * اینکه Referral قبلاً rewarded شده) هرگز ردیف دوم نمی‌سازد.
     *
     * هرگز Exception پرتاب نمی‌کند — دقیقاً همان قرارداد
     * processSellerPayouts: شکست Referral هرگز نباید فرآیند تغییر
     * وضعیت سفارش یا تسویه‌حساب فروشنده را مختل کند (رجوع به بند ۱۶/۱۷
     * درخواست: «Do not modify seller commission/wallet behavior» —
     * یعنی حتی یک خطای غیرمنتظره‌ی اینجا هم نباید آن دو را بشکند).
     */
    public function qualifyAndRewardForCompletedOrder(Order $order): void
    {
        // بند ۱: سفارش باید متعلق به یک کاربر واقعی/احرازشده باشد —
        // سفارش مهمان (user_id خالی) هرگز نمی‌تواند referred_user_id
        // هیچ Referral ای باشد.
        if (! $order->user_id) {
            return;
        }

        // بند ۴: فقط وقتی سفارش واقعاً در وضعیت نهاییِ موجود این پروژه است.
        if (! in_array($order->status, self::QUALIFYING_STATUSES, true)) {
            return;
        }

        DB::beginTransaction();
        try {
            // بند ۸: قفل ردیف Referral — همان انضباط تراکنش/قفل
            // processSellerPayouts، فقط روی موجودیتی که اینجا باید
            // idempotent محافظت شود (Referral، نه Order).
            $referral = Referral::where('referred_user_id', $order->user_id)
                ->lockForUpdate()
                ->first();

            // بند ۳: کاربر معرفی‌شده‌ای برای این سفارش وجود ندارد.
            if (! $referral) {
                DB::rollBack();

                return;
            }

            // بند ۷: اگر از قبل qualified/rewarded/cancelled/rejected
            // شده، دوباره پردازش نکن — فقط pending واقعاً واجد شرایط است.
            if ($referral->status !== Referral::STATUS_PENDING) {
                DB::rollBack();

                return;
            }

            // دفاع اضافه (نباید طبق چک بالا لازم شود، ولی بی‌ضرر است):
            // اگر به هر دلیلی ردیف reward از قبل ساخته شده، دوباره نساز.
            if (ReferralReward::where('referral_id', $referral->id)->exists()) {
                DB::rollBack();

                return;
            }

            // بند ۵/۶: باید دقیقاً *اولین* سفارش صلاحیت‌دار همین کاربر
            // معرفی‌شده باشد — نه هر سفارش completed/delivered ای که به
            // این متد می‌رسد. اگر کاربر قبلاً یک سفارش completed/delivered
            // دیگر داشته (که چون Referral هنوز pending است یعنی آن
            // سفارش هم به هر دلیلی reward نساخته — مثلاً از قبل از این
            // فاز)، این سفارش فعلی «اولین» نیست و نباید reward بسازد.
            $firstQualifyingOrderId = Order::where('user_id', $order->user_id)
                ->whereIn('status', self::QUALIFYING_STATUSES)
                ->orderBy('created_at')
                ->orderBy('id')
                ->value('id');

            if ($firstQualifyingOrderId !== $order->id) {
                DB::rollBack();

                return;
            }

            // بند ۹: مبلغ پاداش کاملاً از config می‌آید — هیچ‌جا هاردکد نیست.
            $rewardAmount = (float) config('azkala.referral.reward.amount', 50000);
            $rewardType = (string) config('azkala.referral.reward.type', ReferralReward::TYPE_FIXED_CREDIT);
            $now = now();

            try {
                $reward = ReferralReward::create([
                    'referral_id' => $referral->id,
                    'referrer_user_id' => $referral->referrer_user_id,
                    'order_id' => $order->id,
                    'amount' => $rewardAmount,
                    'type' => $rewardType,
                    'status' => ReferralReward::STATUS_GRANTED,
                    'rewarded_at' => $now,
                ]);
            } catch (QueryException $e) {
                if ($this->isUniqueConstraintViolation($e)) {
                    // یک ردیف دیگر هم‌زمان همین Referral (یا همین سفارش) را
                    // پاداش داد — idempotent، بی‌صدا نادیده گرفته می‌شود.
                    DB::rollBack();

                    return;
                }

                throw $e;
            }

            // بند ۱۰/۱۱: Referral فقط *بعد از* موفقیت واقعیِ ساخت ردیف
            // reward منتقل می‌شود — هرگز پیش از آن (تا هیچ حالت
            // «rewarded ولی هیچ ردیف لجری وجود ندارد» ممکن نباشد).
            $referral->update([
                'status' => Referral::STATUS_REWARDED,
                'qualified_at' => $referral->qualified_at ?? $now,
                'rewarded_at' => $now,
            ]);

            DB::commit();

            Log::info('[ReferralReward] پاداش معرفی با موفقیت ثبت شد.', [
                'referral_id' => $referral->id,
                'reward_id' => $reward->id,
                'order_id' => $order->id,
                'amount' => $rewardAmount,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('[ReferralReward] خطا در پردازش پاداش معرفی: '.$e->getMessage(), [
                'order_id' => $order->id,
            ]);
            // ✅ عمداً throw نمی‌شود — رجوع به کامنت بالای متد.
        }
    }

    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        // همان کد SQLSTATE که ReferralService از قبل برای همین منظور
        // استفاده می‌کند — پایدار روی MySQL و SQLite (محیط تست).
        return $e->getCode() === '23000';
    }
}
