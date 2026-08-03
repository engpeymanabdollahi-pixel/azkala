<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSellerApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seller = User::factory()->create([
            'role' => 'seller',
            'is_active' => true,
            'slug' => 'my-shop',
            'shop_name' => 'فروشگاه من',
            'followers_count' => 0,
        ]);
        $this->customer = User::factory()->create(['role' => 'customer']);
    }

    public function test_seller_profile_is_publicly_visible(): void
    {
        $this->getJson('/api/v1/sellers/my-shop')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_unknown_seller_slug_returns_404(): void
    {
        $this->getJson('/api/v1/sellers/does-not-exist')->assertStatus(404);
    }

    public function test_inactive_seller_is_not_publicly_visible(): void
    {
        $this->seller->update(['is_active' => false]);

        $this->getJson('/api/v1/sellers/my-shop')->assertStatus(404);
    }

    public function test_a_customer_account_is_not_exposed_as_a_seller(): void
    {
        $this->customer->update(['slug' => 'not-a-seller']);

        $this->getJson('/api/v1/sellers/not-a-seller')->assertStatus(404);
    }

    public function test_seller_products_only_lists_that_sellers_active_products(): void
    {
        $otherSeller = User::factory()->create(['role' => 'seller', 'is_active' => true, 'slug' => 'other']);

        Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => true, 'name' => 'مال این فروشنده']);
        Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => false, 'name' => 'غیرفعال']);
        Product::factory()->create(['seller_id' => $otherSeller->id, 'is_active' => true, 'name' => 'مال فروشنده دیگر']);

        $response = $this->getJson('/api/v1/sellers/my-shop/products');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('مال این فروشنده', $response->json('data.0.name'));
    }

    public function test_follow_requires_authentication(): void
    {
        $this->postJson("/api/v1/sellers/{$this->seller->id}/follow")->assertStatus(401);
    }

    /**
     * Regression: routes/api_v1.php used to redefine follow/unfollow inside its
     * *public* group. Because both route files are mounted, that unauthenticated
     * DELETE won registration over the authenticated one in routes/api.php, so
     * unfollow reached the controller with $request->user() === null and threw
     * "Attempt to read property id on null" - a 500 for every caller, even one
     * sending a valid Sanctum token (the token was never resolved, since the
     * route sat outside auth:sanctum). Note actingAs() cannot catch this: it
     * sets the user directly and bypasses route middleware, which is why the
     * other tests here passed against the broken routing.
     */
    public function test_unfollow_requires_authentication(): void
    {
        $this->deleteJson("/api/v1/sellers/{$this->seller->id}/follow")->assertStatus(401);
    }

    /**
     * Regression: the same public group also exposed GET /sellers/{id}/follow
     * mapped to the follow() action - a state-changing operation reachable by
     * any plain GET. It is gone; only POST may follow.
     */
    public function test_following_is_not_reachable_over_get(): void
    {
        $this->actingAs($this->customer)
            ->getJson("/api/v1/sellers/{$this->seller->id}/follow")
            ->assertStatus(405);

        $this->assertSame(0, (int) $this->seller->fresh()->followers_count);
    }

    public function test_customer_can_follow_a_seller_and_counter_increments(): void
    {
        $this->actingAs($this->customer)
            ->postJson("/api/v1/sellers/{$this->seller->id}/follow")
            ->assertStatus(200)
            ->assertJsonPath('is_following', true)
            ->assertJsonPath('followers_count', 1);

        $this->assertDatabaseHas('seller_follows', [
            'user_id' => $this->customer->id,
            'seller_id' => $this->seller->id,
        ]);
    }

    public function test_following_twice_does_not_double_count(): void
    {
        $this->actingAs($this->customer)->postJson("/api/v1/sellers/{$this->seller->id}/follow")->assertStatus(200);
        $this->actingAs($this->customer)->postJson("/api/v1/sellers/{$this->seller->id}/follow")->assertStatus(200);

        $this->assertSame(1, (int) $this->seller->fresh()->followers_count);
        $this->assertSame(1, \DB::table('seller_follows')
            ->where('user_id', $this->customer->id)
            ->where('seller_id', $this->seller->id)
            ->count());
    }

    public function test_a_seller_cannot_follow_themselves(): void
    {
        $this->actingAs($this->seller)
            ->postJson("/api/v1/sellers/{$this->seller->id}/follow")
            ->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertSame(0, (int) $this->seller->fresh()->followers_count);
    }

    public function test_unfollow_decrements_the_counter(): void
    {
        $this->actingAs($this->customer)->postJson("/api/v1/sellers/{$this->seller->id}/follow")->assertStatus(200);
        $this->assertSame(1, (int) $this->seller->fresh()->followers_count);

        $this->actingAs($this->customer)
            ->deleteJson("/api/v1/sellers/{$this->seller->id}/follow")
            ->assertStatus(200)
            ->assertJsonPath('is_following', false);

        $this->assertSame(0, (int) $this->seller->fresh()->followers_count);
        $this->assertDatabaseMissing('seller_follows', [
            'user_id' => $this->customer->id,
            'seller_id' => $this->seller->id,
        ]);
    }

    public function test_unfollowing_when_not_following_does_not_go_negative(): void
    {
        $this->actingAs($this->customer)
            ->deleteJson("/api/v1/sellers/{$this->seller->id}/follow")
            ->assertStatus(200)
            ->assertJsonPath('is_following', false);

        $this->assertSame(0, (int) $this->seller->fresh()->followers_count);
    }

    public function test_followed_sellers_list_is_scoped_to_the_current_user(): void
    {
        $otherCustomer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($this->customer)->postJson("/api/v1/sellers/{$this->seller->id}/follow")->assertStatus(200);

        $this->actingAs($this->customer)
            ->getJson('/api/v1/user/followed-sellers')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->actingAs($otherCustomer)
            ->getJson('/api/v1/user/followed-sellers')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
