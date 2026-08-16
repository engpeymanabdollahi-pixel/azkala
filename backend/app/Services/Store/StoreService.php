<?php

namespace App\Services\Store;

use App\Models\Store;
use App\Models\StoreHour;
use Illuminate\Support\Facades\DB;

/**
 * مدیریت فروشگاه‌های فیزیکی یک seller (Nearby Physical Stores).
 *
 * ✅ همه‌ی متدهای mutate این کلاس ownership را همیشه با یک شرط واحد در
 * همان کوئری enforce می‌کنند (`where('seller_id', $sellerId)` قبل از
 * firstOrFail) — هرگز با «اول پیدا کن، بعد چک کن» — دقیقاً همان الگوی
 * ثابت‌شده‌ی SellerService::updateProduct/deleteProduct در همین پروژه،
 * تا هیچ فروشنده‌ای نتواند store فروشنده‌ی دیگری را با حدس زدن id
 * دستکاری کند (IDOR).
 *
 * verified_at عمداً در هیچ‌کدام از متدهای این کلاس writable نیست —
 * فقط AdminStoreService آن را تغییر می‌دهد (Phase 16).
 */
class StoreService
{
    public function listForSeller(int $sellerId)
    {
        return Store::where('seller_id', $sellerId)
            ->with('hours')
            ->withCount('inventory')
            ->orderByDesc('created_at')
            ->get();
    }

    public function getForSeller(int $storeId, int $sellerId): Store
    {
        return Store::where('id', $storeId)
            ->where('seller_id', $sellerId)
            ->with('hours')
            ->firstOrFail();
    }

    public function create(int $sellerId, array $data): Store
    {
        return Store::create([
            'seller_id' => $sellerId,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'province' => $data['province'] ?? null,
            'city' => $data['city'] ?? null,
            'address' => $data['address'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            // ✅ verified_at عمداً اینجا نیست — فروشگاه تازه‌ساخته‌شده
            // همیشه تأییدنشده است؛ رجوع به کامنت کلاس.
        ]);
    }

    public function update(int $storeId, int $sellerId, array $data): Store
    {
        $store = $this->getForSeller($storeId, $sellerId);

        $store->update([
            'name' => $data['name'] ?? $store->name,
            'phone' => $data['phone'] ?? $store->phone,
            'province' => $data['province'] ?? $store->province,
            'city' => $data['city'] ?? $store->city,
            'address' => $data['address'] ?? $store->address,
            'latitude' => array_key_exists('latitude', $data) ? $data['latitude'] : $store->latitude,
            'longitude' => array_key_exists('longitude', $data) ? $data['longitude'] : $store->longitude,
            'is_active' => $data['is_active'] ?? $store->is_active,
        ]);

        return $store->fresh('hours');
    }

    public function delete(int $storeId, int $sellerId): void
    {
        $store = $this->getForSeller($storeId, $sellerId);
        $store->delete(); // soft delete
    }

    /**
     * جایگزینی کامل ساعات کاری هفتگی (نه افزودن/حذف تکی) — همان معنای
     * PUT که در باقی این پروژه هم استفاده می‌شود (مثلاً
     * AdminAccessService::setUserPermissions).
     *
     * $hours: آرایه‌ای از ['day_of_week' => 0-6, 'opens_at' => ?, 'closes_at' => ?, 'is_closed' => bool]
     */
    public function setHours(int $storeId, int $sellerId, array $hours): Store
    {
        $store = $this->getForSeller($storeId, $sellerId);

        DB::transaction(function () use ($store, $hours) {
            StoreHour::where('store_id', $store->id)->delete();

            foreach ($hours as $entry) {
                StoreHour::create([
                    'store_id' => $store->id,
                    'day_of_week' => $entry['day_of_week'],
                    'opens_at' => $entry['is_closed'] ?? false ? null : ($entry['opens_at'] ?? null),
                    'closes_at' => $entry['is_closed'] ?? false ? null : ($entry['closes_at'] ?? null),
                    'is_closed' => $entry['is_closed'] ?? false,
                ]);
            }
        });

        return $store->fresh('hours');
    }
}
