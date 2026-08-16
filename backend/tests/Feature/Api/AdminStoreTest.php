<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreInventory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Nearby Physical Stores — Phase 16/22: تایید/رد/فعال‌سازی ادمین.
 * پوشش permission gating (stores.view/stores.manage) با همان middleware
 * استاندارد permission: پروژه (نه یک سیستم authorization موازی).
 */
class AdminStoreTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['admin']);

        return $u;
    }

    private function managerWithout(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['manager']); // ✅ بدون هیچ permission پیش‌فرض

        return $u;
    }

    public function test_admin_can_list_stores(): void
    {
        Store::factory()->count(3)->create();

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/stores')
            ->assertOk();
    }

    public function test_manager_without_permission_cannot_list_stores(): void
    {
        Store::factory()->create();

        $this->actingAs($this->managerWithout(), 'sanctum')
            ->getJson('/api/v1/admin/stores')
            ->assertStatus(403);
    }

    public function test_admin_can_verify_a_pending_store(): void
    {
        $store = Store::factory()->create(['verified_at' => null]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/stores/{$store->id}/verify")
            ->assertOk();

        $this->assertNotNull($store->fresh()->verified_at);
    }

    public function test_verifying_a_store_makes_it_publicly_discoverable(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $store = Store::factory()->create([
            'verified_at' => null,
            'is_active' => true,
            'latitude' => 35.6892,
            'longitude' => 51.3890,
        ]);
        StoreInventory::create(['store_id' => $store->id, 'product_id' => $product->id, 'stock' => 5, 'pickup_enabled' => true]);

        // ✅ قبل از تایید: در جستجوی عمومی دیده نمی‌شود.
        $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=35.6892&lng=51.3890")
            ->assertJsonPath('meta.total', 0);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/stores/{$store->id}/verify")
            ->assertOk();

        // ✅ نتیجه‌ی قبل از تایید تا ۶۰ ثانیه cache شده (Phase 12 — TTL
        // کوتاه)؛ برای اینکه این تست منطق authorization را بسنجد نه
        // رفتار TTL کش، کش را دستی پاک می‌کنیم — دقیقاً همان چیزی که در
        // production بعد از گذشت TTL به‌طور طبیعی رخ می‌دهد.
        Cache::flush();

        // ✅ بعد از تایید: دیده می‌شود.
        $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=35.6892&lng=51.3890")
            ->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_reject_a_store(): void
    {
        $store = Store::factory()->create(['verified_at' => null]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/stores/{$store->id}/reject")
            ->assertOk();

        $this->assertSoftDeleted('stores', ['id' => $store->id]);
    }

    public function test_admin_can_deactivate_a_verified_store(): void
    {
        $store = Store::factory()->verified()->create(['is_active' => true]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/stores/{$store->id}/deactivate")
            ->assertOk();

        $this->assertFalse((bool) $store->fresh()->is_active);
    }

    public function test_seller_cannot_verify_their_own_store(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $store = Store::factory()->create(['seller_id' => $seller->id, 'verified_at' => null]);

        $this->actingAs($seller, 'sanctum')
            ->postJson("/api/v1/admin/stores/{$store->id}/verify")
            ->assertStatus(403);

        $this->assertNull($store->fresh()->verified_at);
    }

    public function test_guest_cannot_access_admin_stores(): void
    {
        $this->getJson('/api/v1/admin/stores')->assertStatus(401);
    }
}
