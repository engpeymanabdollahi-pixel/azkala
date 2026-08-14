<?php

namespace App\Services\Seller;

use App\Models\CommissionRule;
use App\Models\SellerPerformanceScore;
use App\Models\SellerRating;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * محاسبه‌ی امتیاز عملکرد (۰ تا ۱۰۰) و سطح متناظر یک فروشنده.
 *
 * ورودی‌ها همگی از داده‌ی واقعی موجود در دیتابیس می‌آیند (seller_ratings،
 * سفارش‌های نتیجه‌گرفته‌شده‌ی این فروشنده، تاریخ seller_verified_at) — هیچ
 * عددی fabricate نمی‌شود. وزن‌ها/thresholdها از Setting (group=commission)
 * خوانده می‌شوند، نه هاردکد.
 *
 * خروجی این سرویس فقط یک اسنپ‌شات (SellerPerformanceScore) است؛ خودش هیچ
 * تصمیمی درباره‌ی نرخ کمیسیون نمی‌گیرد — آن تصمیم روی CommissionService
 * است (که قانون منطبق در commission_rules را پیدا می‌کند).
 */
class SellerPerformanceService
{
    // وضعیت‌های سفارش که «نتیجه‌گرفته» تلقی می‌شوند (نه هنوز در جریان).
    // pending/processing/shipped عمداً کنار گذاشته شده‌اند — سفارشی که هنوز
    // به نتیجه نرسیده نباید روی نرخ موفقیت/لغو اثر بگذارد.
    private const SUCCESS_STATUSES = ['delivered', 'completed'];

    private const CANCELLED_STATUSES = ['cancelled', 'returned'];

    public function calculate(User $seller): SellerPerformanceScore
    {
        $weights = $this->weights();

        $orderStats = $this->orderStats($seller->id);
        $ratingStats = $this->ratingStats($seller->id);

        $hasAnyHistory = $orderStats['total'] > 0 || $ratingStats['rating_count'] > 0;

        if (! $hasAnyHistory) {
            // فروشنده‌ی تازه‌تایید‌شده، بدون هیچ سفارش نتیجه‌گرفته یا Rating
            // — امتیازدهی واقعی روی داده‌ی صفر بی‌معنی است؛ به‌جای آن از
            // مقدار پیش‌فرض قابل‌تنظیم استفاده می‌شود (پیش‌فرض: صفر، یعنی
            // سطح پایه/Bronze تا وقتی سابقه‌ای بسازد).
            $newSellerScore = (float) Setting::get('commission_new_seller_score', 0);

            return $this->persist($seller, [
                'score' => $newSellerScore,
                'rating_component' => 0,
                'success_rate_component' => 0,
                'cancellation_component' => 0,
                'quality_component' => 0,
                'reliability_component' => 0,
                'total_orders' => 0,
                'successful_orders' => 0,
                'cancelled_orders' => 0,
                'is_new_seller' => true,
            ]);
        }

        $ratingComponent = $ratingStats['rating_count'] > 0
            ? ($ratingStats['avg_overall'] / 5) * 100
            : (float) Setting::get('commission_neutral_rating_score', 50);

        $qualityComponent = $ratingStats['rating_count'] > 0
            ? ($ratingStats['avg_quality'] / 5) * 100
            : (float) Setting::get('commission_neutral_rating_score', 50);

        $successRateComponent = $orderStats['total'] > 0
            ? ($orderStats['successful'] / $orderStats['total']) * 100
            : (float) Setting::get('commission_neutral_rating_score', 50);

        $cancellationComponent = $orderStats['total'] > 0
            ? 100 - (($orderStats['cancelled'] / $orderStats['total']) * 100)
            : 100; // بدون هیچ سفارش نتیجه‌گرفته‌ای، چیزی برای لغو‌کردن هم نبوده.

        $reliabilityComponent = $this->reliabilityComponent($seller, $orderStats['successful']);

        $score = $this->weightedAverage([
            $weights['rating'] => $ratingComponent,
            $weights['success_rate'] => $successRateComponent,
            $weights['cancellation'] => $cancellationComponent,
            $weights['quality'] => $qualityComponent,
            $weights['reliability'] => $reliabilityComponent,
        ]);

        return $this->persist($seller, [
            'score' => round($score, 2),
            'rating_component' => round($ratingComponent, 2),
            'success_rate_component' => round($successRateComponent, 2),
            'cancellation_component' => round($cancellationComponent, 2),
            'quality_component' => round($qualityComponent, 2),
            'reliability_component' => round($reliabilityComponent, 2),
            'total_orders' => $orderStats['total'],
            'successful_orders' => $orderStats['successful'],
            'cancelled_orders' => $orderStats['cancelled'],
            'is_new_seller' => false,
        ]);
    }

    /**
     * اگر اسنپ‌شات موجود باشد همان را برمی‌گرداند (بدون محاسبه‌ی دوباره)؛
     * وگرنه یک‌بار محاسبه می‌کند. برای مسیرهای پرتکرار (مثلاً resolve نرخ
     * کمیسیون در هر تسویه) استفاده می‌شود تا هر تسویه یک محاسبه‌ی کامل
     * سنگین اجرا نکند — recalculate صریح (دستی/زمان‌بندی‌شده) مسئول
     * به‌روز نگه‌داشتن اسنپ‌شات است.
     */
    public function getOrCalculate(User $seller): SellerPerformanceScore
    {
        return $seller->performanceScore ?? $this->calculate($seller);
    }

    public function recalculateAll(): int
    {
        $count = 0;
        User::where('role', 'seller')->chunkById(100, function ($sellers) use (&$count) {
            foreach ($sellers as $seller) {
                $this->calculate($seller);
                $count++;
            }
        });

        return $count;
    }

    private function weights(): array
    {
        $raw = [
            'rating' => (float) Setting::get('commission_weight_rating', 30),
            'success_rate' => (float) Setting::get('commission_weight_success_rate', 25),
            'cancellation' => (float) Setting::get('commission_weight_cancellation', 20),
            'quality' => (float) Setting::get('commission_weight_quality', 15),
            'reliability' => (float) Setting::get('commission_weight_reliability', 10),
        ];

        // ✅ جمع وزن‌ها لازم نیست دقیقاً ۱۰۰ باشد — weightedAverage خودش
        // بر مجموع واقعی تقسیم می‌کند؛ یعنی حتی اگر ادمین وزن‌ها را طوری
        // تنظیم کند که جمعشان ۱۰۰ نشود، محاسبه باز هم یک میانگین وزنی
        // معتبر (۰ تا ۱۰۰) می‌ماند، نه یک عدد خارج از بازه.
        return $raw;
    }

    /**
     * @param  array<float, float>  $weightToValue  کلید=وزن، مقدار=امتیاز مؤلفه
     */
    private function weightedAverage(array $weightToValue): float
    {
        $totalWeight = array_sum(array_keys($weightToValue));

        if ($totalWeight <= 0) {
            // همه‌ی وزن‌ها صفر/منفی — میانگین ساده به‌عنوان fallback امن.
            return array_sum($weightToValue) / max(count($weightToValue), 1);
        }

        $sum = 0.0;
        foreach ($weightToValue as $weight => $value) {
            $sum += $weight * $value;
        }

        return max(0, min(100, $sum / $totalWeight));
    }

    private function orderStats(int $sellerId): array
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.seller_id', $sellerId)
            ->whereIn('orders.status', [...self::SUCCESS_STATUSES, ...self::CANCELLED_STATUSES])
            ->selectRaw('orders.status as status, COUNT(*) as cnt')
            ->groupBy('orders.status')
            ->pluck('cnt', 'status');

        $successful = 0;
        $cancelled = 0;
        foreach (self::SUCCESS_STATUSES as $status) {
            $successful += (int) ($rows[$status] ?? 0);
        }
        foreach (self::CANCELLED_STATUSES as $status) {
            $cancelled += (int) ($rows[$status] ?? 0);
        }

        return [
            'total' => $successful + $cancelled,
            'successful' => $successful,
            'cancelled' => $cancelled,
        ];
    }

    private function ratingStats(int $sellerId): array
    {
        $stats = SellerRating::where('seller_id', $sellerId)
            ->selectRaw('COUNT(*) as cnt, AVG(overall_rating) as avg_overall, AVG(product_quality) as avg_quality')
            ->first();

        return [
            'rating_count' => (int) ($stats->cnt ?? 0),
            'avg_overall' => (float) ($stats->avg_overall ?? 0),
            'avg_quality' => (float) ($stats->avg_quality ?? 0),
        ];
    }

    /**
     * سابقه/قابلیت‌اطمینان: ترکیب «چند ماه است تاییدشده» و «چند سفارش موفق
     * تحویل داده» — هر دو با سقف قابل‌تنظیم اشباع می‌شوند (بعد از سقف،
     * اضافه‌شدن بیشتر امتیاز بیشتری نمی‌دهد).
     */
    private function reliabilityComponent(User $seller, int $successfulOrders): float
    {
        $maxMonths = max(1, (float) Setting::get('commission_reliability_max_months', 12));
        $maxOrders = max(1, (float) Setting::get('commission_reliability_max_orders', 200));

        $months = $seller->seller_verified_at
            ? $seller->seller_verified_at->diffInMonths(now())
            : 0;

        $tenureFactor = min(1, $months / $maxMonths);
        $volumeFactor = min(1, $successfulOrders / $maxOrders);

        return (($tenureFactor + $volumeFactor) / 2) * 100;
    }

    private function persist(User $seller, array $data): SellerPerformanceScore
    {
        $rule = CommissionRule::forScore($data['score']);
        $data['level'] = $rule?->level;
        $data['calculated_at'] = now();

        return SellerPerformanceScore::updateOrCreate(
            ['seller_id' => $seller->id],
            $data
        );
    }
}
