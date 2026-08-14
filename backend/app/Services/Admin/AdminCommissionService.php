<?php

namespace App\Services\Admin;

use App\Models\CommissionRule;
use App\Models\User;
use App\Services\Commission\CommissionService;
use App\Services\Seller\SellerPerformanceService;
use Illuminate\Support\Collection;

/**
 * لایه‌ی سرویس برای مدیریت ادمین روی سیستم کمیسیون: خواندن/ویرایش
 * Commission Rules، و مشاهده/تنظیم override هر فروشنده.
 *
 * تصمیم واقعیِ «نرخ کمیسیون این فروشنده الان چقدر است» همیشه در
 * CommissionService می‌ماند — این سرویس فقط دیتای مدیریتی اطراف آن را
 * expose می‌کند، منطق تصمیم‌گیری را تکرار نمی‌کند.
 */
class AdminCommissionService
{
    public function __construct(
        protected CommissionService $commissionService,
        protected SellerPerformanceService $performanceService
    ) {}

    public function getRules(): Collection
    {
        return CommissionRule::orderBy('sort_order')->orderBy('min_score')->get();
    }

    public function createRule(array $data): CommissionRule
    {
        return CommissionRule::create($data);
    }

    public function updateRule(int $id, array $data): CommissionRule
    {
        $rule = CommissionRule::findOrFail($id);
        $rule->update($data);

        return $rule->fresh();
    }

    public function deleteRule(int $id): void
    {
        // ✅ حذف امن است: seller_level روی seller_transactions فقط یک
        // رشته‌ی متنیِ اسنپ‌شات‌شده است (نه FK)، پس حذف یک Rule هیچ رکورد
        // تاریخی‌ای را نمی‌شکند یا تغییر نمی‌دهد.
        CommissionRule::findOrFail($id)->delete();
    }

    /**
     * وضعیت کامل کمیسیون یک فروشنده برای نمایش در پنل ادمین: امتیاز فعلی
     * (اسنپ‌شات آخرین محاسبه، نه لزوماً لحظه‌ای)، نرخ فعلاً قابل‌اعمال، و
     * مقدار override اگر تنظیم شده.
     */
    public function getSellerCommissionInfo(User $seller): array
    {
        $performance = $this->performanceService->getOrCalculate($seller);
        $resolved = $this->commissionService->resolveCommissionRate($seller);

        return [
            'seller_id' => $seller->id,
            'override_rate' => $seller->seller_commission_rate !== null
                ? (float) $seller->seller_commission_rate
                : null,
            'current_rate' => $resolved['rate'],
            'current_source' => $resolved['source'],
            'current_level' => $resolved['level'],
            'score' => [
                'value' => (float) $performance->score,
                'level' => $performance->level,
                'is_new_seller' => $performance->is_new_seller,
                'calculated_at' => $performance->calculated_at,
                'breakdown' => [
                    'rating' => (float) $performance->rating_component,
                    'success_rate' => (float) $performance->success_rate_component,
                    'cancellation' => (float) $performance->cancellation_component,
                    'quality' => (float) $performance->quality_component,
                    'reliability' => (float) $performance->reliability_component,
                ],
                'total_orders' => $performance->total_orders,
                'successful_orders' => $performance->successful_orders,
                'cancelled_orders' => $performance->cancelled_orders,
            ],
        ];
    }

    /**
     * تنظیم/پاک‌کردن override دستی کمیسیون یک فروشنده.
     *
     * seller_commission_rate عمداً fillable نیست (رجوع به کامنت روی مدل
     * User) — این تنها مسیر مجاز برای نوشتن آن است، و فقط از پشت route
     * ادمین (middleware admin) قابل‌دسترسی است. خودِ فروشنده هیچ endpoint ی
     * برای تغییر این مقدار ندارد.
     */
    public function setSellerOverride(User $seller, ?float $rate): User
    {
        $seller->forceFill(['seller_commission_rate' => $rate])->save();

        return $seller->fresh();
    }
}
