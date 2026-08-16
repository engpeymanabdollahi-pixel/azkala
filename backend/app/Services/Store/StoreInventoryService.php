<?php

namespace App\Services\Store;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreInventory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * موجودی فیزیکی هر محصول در هر فروشگاه.
 *
 * ✅ دو لایه‌ی ownership مستقل، هر دو همیشه enforce می‌شوند (طبق دستور
 * صریح Phase 6):
 *   ۱. store.seller_id === $sellerId  (فروشگاه مال همین seller است)
 *   ۲. product.seller_id === $sellerId (محصول هم مال همین seller است)
 * بدون شرط دوم، یک seller می‌توانست محصول یک seller دیگر را به فروشگاه
 * خودش «متصل» کند — چیزی که Phase 6 صریحاً ممنوع کرده.
 */
class StoreInventoryService
{
    public function listForStore(int $storeId, int $sellerId): Collection
    {
        $store = $this->ownedStore($storeId, $sellerId);

        return $store->inventory()->with('product:id,name,slug,main_image,price,discount_price')->get();
    }

    public function upsert(int $storeId, int $productId, int $sellerId, array $data): StoreInventory
    {
        $store = $this->ownedStore($storeId, $sellerId);

        // ✅ لایه‌ی دوم ownership: محصول هم باید واقعاً مال همین seller باشد.
        $product = Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->first();

        if (! $product) {
            throw new ModelNotFoundException('محصول یافت نشد یا متعلق به شما نیست.');
        }

        return StoreInventory::updateOrCreate(
            ['store_id' => $store->id, 'product_id' => $product->id],
            [
                'stock' => max(0, (int) ($data['stock'] ?? 0)),
                'pickup_enabled' => (bool) ($data['pickup_enabled'] ?? true),
            ]
        );
    }

    public function remove(int $storeId, int $productId, int $sellerId): void
    {
        $store = $this->ownedStore($storeId, $sellerId);

        StoreInventory::where('store_id', $store->id)
            ->where('product_id', $productId)
            ->delete();
    }

    private function ownedStore(int $storeId, int $sellerId): Store
    {
        return Store::where('id', $storeId)
            ->where('seller_id', $sellerId)
            ->firstOrFail();
    }
}
