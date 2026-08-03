<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->product = Product::factory()->create(['is_active' => true]);
    }

    public function test_unauthenticated_user_cannot_access_wishlist(): void
    {
        $this->getJson('/api/v1/wishlist')->assertStatus(401);
    }

    public function test_user_can_view_empty_wishlist(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/v1/wishlist')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_user_can_add_product_to_wishlist(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/wishlist', ['product_id' => $this->product->id])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_user_cannot_add_same_product_twice(): void
    {
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/wishlist', ['product_id' => $this->product->id])
            ->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertSame(1, Wishlist::where('user_id', $this->user->id)->count());
    }

    public function test_adding_nonexistent_product_fails_validation(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/wishlist', ['product_id' => 999999])
            ->assertStatus(422);
    }

    public function test_wishlist_only_shows_own_items(): void
    {
        $otherProduct = Product::factory()->create();
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);
        Wishlist::create(['user_id' => $this->otherUser->id, 'product_id' => $otherProduct->id]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/wishlist');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
        $this->assertSame($this->product->id, $response->json('data.data.0.product_id'));
    }

    public function test_user_can_remove_own_item(): void
    {
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/wishlist/{$this->product->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_user_cannot_remove_another_users_item(): void
    {
        Wishlist::create(['user_id' => $this->otherUser->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/wishlist/{$this->product->id}")
            ->assertStatus(404);

        // The other user's row must survive.
        $this->assertDatabaseHas('wishlists', [
            'user_id' => $this->otherUser->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_check_reports_wishlisted_state_per_user(): void
    {
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->getJson("/api/v1/wishlist/check/{$this->product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.is_wishlisted', true);

        $this->actingAs($this->otherUser)
            ->getJson("/api/v1/wishlist/check/{$this->product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.is_wishlisted', false);
    }
}
