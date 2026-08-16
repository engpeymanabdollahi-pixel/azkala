<?php

namespace App\Services\Store;

use App\Models\Store;
use App\Models\StoreHour;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

/**
 * جستجوی «فروشگاه‌های نزدیک این محصول» — یک استراتژی مستقل از DB driver.
 *
 * ✅ چرا Haversine در PHP، نه در SQL خام (cos/sin/acos/radians):
 * محیط تست فعلی (SQLite با پسوند ریاضی فعال) این توابع را پشتیبانی
 * می‌کند، اما DB واقعی production این پروژه از داخل خودِ ریپازیتوری قابل
 * تأیید نیست (Verification Gate این تسک: PRODUCTION DB DRIVER = NOT
 * VERIFIED) و همه‌ی build های SQLite این پسوند ریاضی را کامپایل نکرده‌اند
 * — یعنی تکیه‌کردن به این توابع در SQL می‌توانست دقیقاً همان «عدم تطابق
 * تست/production مخصوص یک DB» باشد که این تسک صریحاً منع کرده. راه‌حل:
 * فقط bounding-box (BETWEEN ساده، صد-در-صد قابل‌حمل روی هر SQL DB) در
 * لایه‌ی دیتابیس اجرا می‌شود — دقیقاً همان کوئری set-based تک‌مرحله‌ای
 * که Phase 10 خواسته (JOIN stores+store_inventory با همه‌ی فیلترها، نه
 * حلقه‌ی هر-فروشگاه-یک-کوئری) — و فاصله‌ی دقیق/مرتب‌سازی/صفحه‌بندی روی
 * همان نتیجه‌ی از قبل کوچک‌شده (حداکثر self::MAX_CANDIDATES ردیف) در PHP
 * انجام می‌شود، نه در یک حلقه‌ی کوئری جدید.
 */
class NearbyStoreService
{
    public const DEFAULT_RADIUS_METERS = 10000;

    public const MAX_RADIUS_METERS = 50000;

    private const MAX_CANDIDATES = 500;

    private const MAX_PER_PAGE = 50;

    private const EARTH_RADIUS_METERS = 6371000;

    /**
     * @return array{stores: Collection, total: int, page: int, per_page: int, radius: int}
     */
    public function search(int $productId, float $lat, float $lng, ?int $radiusMeters, int $page, int $perPage): array
    {
        $this->assertValidCoordinate($lat, -90, 90, 'lat');
        $this->assertValidCoordinate($lng, -180, 180, 'lng');

        $radius = $this->normalizeRadius($radiusMeters);
        $page = max(1, $page);
        $perPage = max(1, min($perPage, self::MAX_PER_PAGE));

        // ✅ Phase 12 — Caching: کلید شامل product_id + مختصات گردشده
        // (round به ۳ رقم اعشار ≈ ۱۱۰ متر — فقط برای جذب لرزش/jitter GPS
        // بین درخواست‌های پشت‌سرهم مرورگر، نه یک تغییر واقعی مکان) + radius
        // + صفحه‌بندی. TTL کوتاه (۶۰ ثانیه). Store::publiclyDiscoverable()
        // از قبل فقط فروشگاه‌های فعال+تأییدشده را برمی‌گرداند، پس هرگز
        // داده‌ی seller-private یا تأییدنشده cache نمی‌شود.
        $cacheKey = sprintf(
            'nearby_stores:%d:%s:%s:%d:%d:%d',
            $productId,
            round($lat, 3),
            round($lng, 3),
            $radius,
            $page,
            $perPage
        );

        return Cache::remember($cacheKey, 60, function () use ($productId, $lat, $lng, $radius, $page, $perPage) {
            return $this->performSearch($productId, $lat, $lng, $radius, $page, $perPage);
        });
    }

    /**
     * @return array{stores: Collection, total: int, page: int, per_page: int, radius: int}
     */
    private function performSearch(int $productId, float $lat, float $lng, int $radius, int $page, int $perPage): array
    {
        [$minLat, $maxLat, $minLng, $maxLng] = $this->boundingBox($lat, $lng, $radius);

        // ✅ یک کوئری واحد set-based: stores (فعال+تأییدشده+مختصات معتبر)
        // JOIN store_inventory (همین محصول، موجودی>۰، pickup_enabled)
        // JOIN products (فعال) — نه حلقه‌ای که برای هر store جدا کوئری
        // بزند.
        $candidates = Store::query()
            ->publiclyDiscoverable()
            ->whereBetween('latitude', [$minLat, $maxLat])
            ->whereBetween('longitude', [$minLng, $maxLng])
            ->join('store_inventory', 'store_inventory.store_id', '=', 'stores.id')
            ->join('products', 'products.id', '=', 'store_inventory.product_id')
            ->where('store_inventory.product_id', $productId)
            ->where('store_inventory.stock', '>', 0)
            ->where('store_inventory.pickup_enabled', true)
            ->where('products.is_active', true)
            ->select([
                'stores.id',
                'stores.name',
                'stores.city',
                'stores.province',
                'stores.address',
                'stores.phone',
                'stores.latitude',
                'stores.longitude',
                'store_inventory.stock',
                'store_inventory.pickup_enabled',
            ])
            ->limit(self::MAX_CANDIDATES)
            ->get();

        $withDistance = $candidates
            ->map(function ($row) use ($lat, $lng) {
                $row->distance_meters = $this->haversineMeters($lat, $lng, (float) $row->latitude, (float) $row->longitude);

                return $row;
            })
            ->filter(fn ($row) => $row->distance_meters <= $radius)
            ->sortBy('distance_meters')
            ->values();

        $total = $withDistance->count();
        $items = $withDistance->forPage($page, $perPage)->values();

        return [
            'stores' => $this->attachHours($items),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'radius' => $radius,
        ];
    }

    /**
     * ساعات کاری هفتگی هر فروشگاه را به نتیجه‌ی نهایی اضافه می‌کند —
     * Nearby Stores Completion Phase.
     *
     * ✅ نه N+1: دقیقاً یک کوئری batch اضافی (whereIn) برای همه‌ی
     * store_id های همان صفحه‌ی نهایی (حداکثر self::MAX_PER_PAGE، نه کل
     * مجموعه‌ی کاندید تا self::MAX_CANDIDATES) — نه حلقه‌ای که برای هر
     * فروشگاه جدا StoreHour بخواند.
     *
     * ✅ خروجی هر آیتم را عمداً به آرایه‌ی PHP تبدیل می‌کند (toArray)،
     * نه mutate کردن مستقیم property روی مدل Eloquent — چون «hours» دقیقاً
     * همنام رابطه‌ی Store::hours() است و نوشتن مستقیم روی آن مدل می‌توانست
     * گیج‌کننده/شکننده باشد؛ تبدیل به آرایه‌ی ساده این ابهام را کاملاً حذف
     * می‌کند و شکل JSON خروجی هم دقیقاً همان چیزی می‌ماند که تست‌های
     * موجود از قبل انتظار دارند.
     *
     * ✅ فقط فیلدهای امن/عمومی هر روز (day_of_week/opens_at/closes_at/
     * is_closed) برگردانده می‌شود — id/store_id/timestamps داخلی حذف
     * می‌شوند.
     */
    private function attachHours(Collection $items): Collection
    {
        if ($items->isEmpty()) {
            return $items;
        }

        $hoursByStore = StoreHour::whereIn('store_id', $items->pluck('id'))
            ->orderBy('day_of_week')
            ->get()
            ->groupBy('store_id');

        return $items->map(function ($row) use ($hoursByStore) {
            $array = $row->toArray();

            $array['hours'] = ($hoursByStore->get($row->id) ?? collect())
                ->map(fn (StoreHour $hour) => [
                    'day_of_week' => $hour->day_of_week,
                    'opens_at' => $hour->opens_at,
                    'closes_at' => $hour->closes_at,
                    'is_closed' => $hour->is_closed,
                ])
                ->values();

            return $array;
        });
    }

    private function normalizeRadius(?int $radiusMeters): int
    {
        if ($radiusMeters === null) {
            return self::DEFAULT_RADIUS_METERS;
        }

        if ($radiusMeters <= 0) {
            throw new InvalidArgumentException('radius باید عددی مثبت باشد.');
        }

        return min($radiusMeters, self::MAX_RADIUS_METERS);
    }

    private function assertValidCoordinate(float $value, float $min, float $max, string $field): void
    {
        // ✅ is_finite هم NAN و هم INF/-INF را رد می‌کند — مقادیر عجیبی
        // مثل "1e400" از نظر Laravel validation rule «numeric» معتبرند
        // ولی بعد از cast به float به INF سرریز می‌شوند.
        if (! is_finite($value) || $value < $min || $value > $max) {
            throw new InvalidArgumentException("مقدار {$field} نامعتبر است.");
        }
    }

    /**
     * جعبه‌ی محدودکننده‌ی تقریبی (نه دقیق نزدیک قطب‌ها، که برای این
     * مقیاس بازار اهمیتی ندارد) — فقط برای کوچک‌کردن سریع مجموعه‌ی
     * کاندید در دیتابیس، پیش از محاسبه‌ی فاصله‌ی دقیق.
     */
    private function boundingBox(float $lat, float $lng, int $radiusMeters): array
    {
        $latDelta = $radiusMeters / self::EARTH_RADIUS_METERS * (180 / M_PI);
        $lngDelta = $radiusMeters / (self::EARTH_RADIUS_METERS * cos(deg2rad($lat))) * (180 / M_PI);

        return [
            max(-90, $lat - $latDelta),
            min(90, $lat + $latDelta),
            $lng - $lngDelta,
            $lng + $lngDelta,
        ];
    }

    private function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLng = deg2rad($lng2 - $lng1);

        $a = sin($deltaLat / 2) ** 2
            + cos($lat1Rad) * cos($lat2Rad) * sin($deltaLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }
}
