<?php

namespace Tests\Feature\Api;

use App\Models\Store;
use App\Models\StoreHour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Nearby Physical Stores — Phase 22: مدیریت فروشگاه فیزیکی فروشنده.
 * پوشش: CRUD پایه، IDOR (فروشنده‌ی A نباید فروشگاه فروشنده‌ی B را ببیند/
 * ویرایش/حذف کند)، ساعات کاری (uniqueness هر روز)، و اینکه یک فروشگاه
 * تازه‌ساخته‌شده هرگز verified نیست.
 */
class SellerStoreTest extends TestCase
{
    use RefreshDatabase;

    private function seller(): User
    {
        return User::factory()->create(['role' => 'seller']);
    }

    public function test_seller_can_create_a_store(): void
    {
        $seller = $this->seller();

        $response = $this->actingAs($seller, 'sanctum')->postJson('/api/v1/seller/stores', [
            'name' => 'شعبه ولیعصر',
            'city' => 'تهران',
            'latitude' => 35.7219,
            'longitude' => 51.3347,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas('stores', [
            'seller_id' => $seller->id,
            'name' => 'شعبه ولیعصر',
        ]);
    }

    public function test_newly_created_store_is_never_pre_verified(): void
    {
        $seller = $this->seller();

        $this->actingAs($seller, 'sanctum')->postJson('/api/v1/seller/stores', [
            'name' => 'شعبه تست',
        ])->assertCreated();

        $store = Store::where('seller_id', $seller->id)->first();
        $this->assertNull($store->verified_at);
    }

    public function test_seller_sees_only_their_own_stores(): void
    {
        $sellerA = $this->seller();
        $sellerB = $this->seller();

        Store::factory()->count(2)->create(['seller_id' => $sellerA->id]);
        Store::factory()->count(3)->create(['seller_id' => $sellerB->id]);

        $response = $this->actingAs($sellerA, 'sanctum')->getJson('/api/v1/seller/stores');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_seller_cannot_view_another_sellers_store(): void
    {
        $sellerA = $this->seller();
        $sellerB = $this->seller();
        $storeB = Store::factory()->create(['seller_id' => $sellerB->id]);

        $this->actingAs($sellerA, 'sanctum')
            ->getJson("/api/v1/seller/stores/{$storeB->id}")
            ->assertStatus(404);
    }

    public function test_seller_cannot_update_another_sellers_store(): void
    {
        $sellerA = $this->seller();
        $sellerB = $this->seller();
        $storeB = Store::factory()->create(['seller_id' => $sellerB->id, 'name' => 'اصلی']);

        $this->actingAs($sellerA, 'sanctum')
            ->putJson("/api/v1/seller/stores/{$storeB->id}", ['name' => 'دستکاری‌شده'])
            ->assertStatus(404);

        $this->assertDatabaseHas('stores', ['id' => $storeB->id, 'name' => 'اصلی']);
    }

    public function test_seller_cannot_delete_another_sellers_store(): void
    {
        $sellerA = $this->seller();
        $sellerB = $this->seller();
        $storeB = Store::factory()->create(['seller_id' => $sellerB->id]);

        $this->actingAs($sellerA, 'sanctum')
            ->deleteJson("/api/v1/seller/stores/{$storeB->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('stores', ['id' => $storeB->id]);
    }

    public function test_seller_can_soft_delete_their_own_store(): void
    {
        $seller = $this->seller();
        $store = Store::factory()->create(['seller_id' => $seller->id]);

        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/v1/seller/stores/{$store->id}")
            ->assertOk();

        $this->assertSoftDeleted('stores', ['id' => $store->id]);
    }

    public function test_seller_can_set_weekly_hours_for_their_own_store(): void
    {
        $seller = $this->seller();
        $store = Store::factory()->create(['seller_id' => $seller->id]);

        $response = $this->actingAs($seller, 'sanctum')->putJson("/api/v1/seller/stores/{$store->id}/hours", [
            'hours' => [
                ['day_of_week' => 0, 'opens_at' => '09:00', 'closes_at' => '21:00'],
                ['day_of_week' => 5, 'is_closed' => true],
            ],
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('store_hours', ['store_id' => $store->id, 'day_of_week' => 0]);
        $this->assertDatabaseHas('store_hours', ['store_id' => $store->id, 'day_of_week' => 5, 'is_closed' => true]);
    }

    public function test_setting_hours_replaces_previous_hours_entirely(): void
    {
        $seller = $this->seller();
        $store = Store::factory()->create(['seller_id' => $seller->id]);

        $this->actingAs($seller, 'sanctum')->putJson("/api/v1/seller/stores/{$store->id}/hours", [
            'hours' => [['day_of_week' => 0, 'opens_at' => '09:00', 'closes_at' => '21:00']],
        ])->assertOk();

        // جایگزینی کامل: این بار فقط روز ۱ ارسال می‌شود؛ روز ۰ قبلی باید حذف شود.
        $this->actingAs($seller, 'sanctum')->putJson("/api/v1/seller/stores/{$store->id}/hours", [
            'hours' => [['day_of_week' => 1, 'opens_at' => '10:00', 'closes_at' => '20:00']],
        ])->assertOk();

        $this->assertDatabaseMissing('store_hours', ['store_id' => $store->id, 'day_of_week' => 0]);
        $this->assertDatabaseHas('store_hours', ['store_id' => $store->id, 'day_of_week' => 1]);
        $this->assertEquals(1, StoreHour::where('store_id', $store->id)->count());
    }

    public function test_guest_cannot_access_seller_stores(): void
    {
        $this->getJson('/api/v1/seller/stores')->assertStatus(401);
    }

    public function test_customer_cannot_access_seller_stores(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/seller/stores')
            ->assertStatus(403);
    }
}
