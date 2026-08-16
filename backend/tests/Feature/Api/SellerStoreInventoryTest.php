<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreInventory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Nearby Physical Stores — Phase 22: موجودی فیزیکی محصولات یک فروشگاه.
 *
 * ✅ تمرکز اصلی: دو لایه‌ی ownership مستقل (Phase 6) — یک seller نباید
 * بتواند نه فروشگاه فروشنده‌ی دیگر را دستکاری کند، و نه محصول فروشنده‌ی
 * دیگر را به فروشگاه خودش «متصل» کند، حتی اگر store_id متعلق به خودش باشد.
 */
class SellerStoreInventoryTest extends TestCase
{
    use RefreshDatabase;

    private function sellerWithStore(): array
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $store = Store::factory()->create(['seller_id' => $seller->id]);

        return [$seller, $store];
    }

    public function test_seller_can_set_stock_for_their_own_product_in_their_own_store(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        $response = $this->actingAs($seller, 'sanctum')->postJson("/api/v1/seller/stores/{$store->id}/inventory", [
            'product_id' => $product->id,
            'stock' => 15,
            'pickup_enabled' => true,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('store_inventory', [
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock' => 15,
        ]);
    }

    public function test_upsert_is_idempotent_by_store_and_product(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        $this->actingAs($seller, 'sanctum')->postJson("/api/v1/seller/stores/{$store->id}/inventory", [
            'product_id' => $product->id,
            'stock' => 5,
        ])->assertOk();

        $this->actingAs($seller, 'sanctum')->postJson("/api/v1/seller/stores/{$store->id}/inventory", [
            'product_id' => $product->id,
            'stock' => 9,
        ])->assertOk();

        $this->assertEquals(1, StoreInventory::where('store_id', $store->id)->where('product_id', $product->id)->count());
        $this->assertDatabaseHas('store_inventory', ['store_id' => $store->id, 'product_id' => $product->id, 'stock' => 9]);
    }

    public function test_seller_cannot_attach_inventory_to_another_sellers_store(): void
    {
        [$sellerA] = $this->sellerWithStore();
        [$sellerB, $storeB] = $this->sellerWithStore();
        $productA = Product::factory()->create(['seller_id' => $sellerA->id]);

        $this->actingAs($sellerA, 'sanctum')->postJson("/api/v1/seller/stores/{$storeB->id}/inventory", [
            'product_id' => $productA->id,
            'stock' => 10,
        ])->assertStatus(404);

        $this->assertDatabaseMissing('store_inventory', ['store_id' => $storeB->id]);
    }

    public function test_seller_cannot_attach_another_sellers_product_to_their_own_store(): void
    {
        // ✅ دقیقاً همان سناریوی توضیح‌داده‌شده در Phase 6: store مال
        // خودِ seller است، ولی product مال یک seller دیگر — باید رد شود.
        [$sellerA, $storeA] = $this->sellerWithStore();
        $productOfSellerB = Product::factory()->create(); // seller دیگری خودکار از factory

        $response = $this->actingAs($sellerA, 'sanctum')->postJson("/api/v1/seller/stores/{$storeA->id}/inventory", [
            'product_id' => $productOfSellerB->id,
            'stock' => 10,
        ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('store_inventory', ['store_id' => $storeA->id, 'product_id' => $productOfSellerB->id]);
    }

    public function test_stock_cannot_be_negative(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        $this->actingAs($seller, 'sanctum')->postJson("/api/v1/seller/stores/{$store->id}/inventory", [
            'product_id' => $product->id,
            'stock' => -5,
        ])->assertStatus(422);
    }

    public function test_seller_can_remove_a_product_from_their_store_inventory(): void
    {
        [$seller, $store] = $this->sellerWithStore();
        $product = Product::factory()->create(['seller_id' => $seller->id]);
        StoreInventory::create(['store_id' => $store->id, 'product_id' => $product->id, 'stock' => 5]);

        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/v1/seller/stores/{$store->id}/inventory/{$product->id}")
            ->assertOk();

        $this->assertDatabaseMissing('store_inventory', ['store_id' => $store->id, 'product_id' => $product->id]);
    }

    public function test_seller_cannot_remove_inventory_from_another_sellers_store(): void
    {
        [$sellerA] = $this->sellerWithStore();
        [$sellerB, $storeB] = $this->sellerWithStore();
        $productB = Product::factory()->create(['seller_id' => $sellerB->id]);
        StoreInventory::create(['store_id' => $storeB->id, 'product_id' => $productB->id, 'stock' => 5]);

        $this->actingAs($sellerA, 'sanctum')
            ->deleteJson("/api/v1/seller/stores/{$storeB->id}/inventory/{$productB->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('store_inventory', ['store_id' => $storeB->id, 'product_id' => $productB->id]);
    }
}
