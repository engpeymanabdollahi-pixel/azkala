<?php

namespace App\Services\Commission;

use App\Models\CommissionRule;
use App\Models\Setting;
use App\Models\User;
use App\Services\Seller\SellerPerformanceService;

/**
 * تنها نقطه‌ی تصمیم‌گیری «این فروشنده الان چند درصد کمیسیون می‌دهد؟».
 *
 * معماری درخواستی:
 *   CommissionService → Seller Performance/Score → Commission Rule → Seller Payout
 *
 * اولویت طبق دستور کار صریح است: اول override واقعی و معتبر (یعنی
 * users.seller_commission_rate غیر NULL)، وگرنه بر اساس Score فروشنده و
 * Commission Rule فعال. اگر هیچ Rule ای با امتیاز مطابقت نداشت (مثلاً
 * ادمین همه‌ی rule ها را غیرفعال کرده)، به نرخ پیش‌فرض configurable برمی‌گردد.
 *
 * خروجی این متد فقط برای *محاسبه‌ی همین لحظه* است — استفاده‌کننده (مثلاً
 * AdminOrderService) موظف است source/level/score بازگشتی را همراه با نرخ
 * روی seller_transactions ثبت کند تا اگر بعداً Rule یا Score عوض شد، این
 * تسویه‌ی خاص همچنان قابل توضیح بماند (نه دوباره‌محاسبه‌شونده).
 */
class CommissionService
{
    public function __construct(protected SellerPerformanceService $performanceService) {}

    public function resolveCommissionRate(User $seller): array
    {
        if ($seller->seller_commission_rate !== null) {
            return [
                'rate' => round((float) $seller->seller_commission_rate, 2),
                'source' => 'override',
                'level' => null,
                'score' => null,
            ];
        }

        // ✅ عمداً calculate() (محاسبه‌ی زنده)، نه getOrCalculate() —
        // resolveCommissionRate دقیقاً لحظه‌ی تسویه‌ی واقعی پول صدا زده
        // می‌شود؛ تکیه به یک اسنپ‌شات قدیمی (که ممکن است چند روز/هفته
        // به‌روز نشده باشد) یعنی احتمال تخصیص سطح/نرخ نادرست به یک تسویه‌ی
        // واقعی. هزینه‌ی این چند کوئری اضافه در ازای هر تسویه (نه هر
        // درخواست HTTP معمولی) قابل قبول است. getOrCalculate برای مسیرهای
        // فقط-نمایشی (مثلاً ستون Score در پنل ادمین) باقی می‌ماند.
        $performance = $this->performanceService->calculate($seller);
        $score = (float) $performance->score;
        $rule = CommissionRule::forScore($score);

        [$min, $max] = $this->bounds();

        if ($rule) {
            return [
                'rate' => $this->clamp(round((float) $rule->commission_rate, 2), $min, $max),
                'source' => 'score_rule',
                'level' => $rule->level,
                'score' => $score,
            ];
        }

        $default = (float) Setting::get('commission_default_rate', config('azkala.default_commission_rate', 5.00));

        return [
            'rate' => $this->clamp(round($default, 2), $min, $max),
            'source' => 'default',
            'level' => null,
            'score' => $score,
        ];
    }

    private function bounds(): array
    {
        $min = (float) Setting::get('commission_min_rate', 1);
        $max = (float) Setting::get('commission_max_rate', 4);

        // ✅ دفاعی: اگر ادمین به‌اشتباه min را بزرگ‌تر از max تنظیم کند،
        // به‌جای یک بازه‌ی نامعتبر که clamp را می‌شکند، جابه‌جا می‌شوند.
        return $min > $max ? [$max, $min] : [$min, $max];
    }

    private function clamp(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }
}
