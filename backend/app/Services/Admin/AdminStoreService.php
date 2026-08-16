<?php

namespace App\Services\Admin;

use App\Models\Store;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * لایه‌ی مدیریتی روی فروشگاه‌های فیزیکی: مشاهده/تایید/رد/غیرفعال‌سازی.
 *
 * ✅ یک فروشگاه تا وقتی admin آن را تایید نکند (verified_at پر نشود)
 * هرگز در جستجوی عمومی (NearbyStoreService) ظاهر نمی‌شود — رجوع به
 * Store::scopePubliclyDiscoverable که whereNotNull('verified_at') دارد.
 * verify()/reject() تنها راه تغییر این ستون‌اند (StoreService سمت seller
 * عمداً آن را writable نمی‌کند).
 */
class AdminStoreService
{
    public function list(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        $query = Store::query()->with('seller:id,name,email')->withCount('inventory');

        if (($filters['status'] ?? null) === 'pending') {
            $query->whereNull('verified_at');
        } elseif (($filters['status'] ?? null) === 'verified') {
            $query->whereNotNull('verified_at');
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function verify(int $storeId): Store
    {
        $store = Store::findOrFail($storeId);
        $store->update(['verified_at' => now()]);

        return $store->fresh('seller');
    }

    public function reject(int $storeId): Store
    {
        // ✅ «رد» به معنای حذف نرم است، نه صرفاً پاک‌کردن verified_at —
        // چون یک seller باید بتواند دوباره فروشگاه جدید بسازد، و تاریخچه
        // نگه داشته می‌شود (SoftDeletes روی جدول stores).
        $store = Store::findOrFail($storeId);
        $store->update(['verified_at' => null, 'is_active' => false]);
        $store->delete();

        return $store;
    }

    public function deactivate(int $storeId): Store
    {
        $store = Store::findOrFail($storeId);
        $store->update(['is_active' => false]);

        return $store->fresh('seller');
    }

    public function activate(int $storeId): Store
    {
        $store = Store::findOrFail($storeId);
        $store->update(['is_active' => true]);

        return $store->fresh('seller');
    }
}
