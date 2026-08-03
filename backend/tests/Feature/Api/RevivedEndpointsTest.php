<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Endpoints that were registered but bound to controller methods that did not
 * exist, so every call returned 500. Each is covered here now that it works.
 */
class RevivedEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    // ---------------------------------------------------------------- cart

    /**
     * DELETE /cart/clear was registered after DELETE /cart/{cartItemId}, so the
     * wildcard matched first and the request reached destroy() with "clear" as
     * the id - a TypeError, not even a 404. The route now precedes the wildcard.
     */
    public function test_clearing_the_cart_removes_every_item(): void
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        foreach (Product::factory()->count(3)->create(['is_active' => true]) as $product) {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => $product->price,
            ]);
        }

        $this->actingAs($this->user)
            ->deleteJson('/api/v1/cart/clear')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(0, CartItem::where('cart_id', $cart->id)->count());
    }

    public function test_clearing_an_already_empty_cart_succeeds(): void
    {
        $this->actingAs($this->user)
            ->deleteJson('/api/v1/cart/clear')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * The ordering fix must not shadow the wildcard it was placed in front of.
     */
    public function test_deleting_a_single_cart_item_still_works(): void
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $product = Product::factory()->create(['is_active' => true]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => $product->price,
        ]);
        $keep = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => Product::factory()->create(['is_active' => true])->id,
            'quantity' => 1,
            'price' => 100,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/cart/{$item->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
        $this->assertDatabaseHas('cart_items', ['id' => $keep->id]);
    }

    // ------------------------------------------------------ admin categories

    public function test_admin_can_delete_an_empty_category(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/categories/{$category->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('categories', ['id' => $category->id]);
    }

    /**
     * Mirrors the rule the repository's bulkAction('delete') already applied:
     * a category with children or products is not deletable.
     */
    public function test_a_category_with_products_is_not_deleted(): void
    {
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/categories/{$category->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertStringContainsString('محصول', $response->json('message'));
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'deleted_at' => null]);
    }

    public function test_a_category_with_children_is_not_deleted(): void
    {
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/categories/{$parent->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('categories', ['id' => $parent->id, 'deleted_at' => null]);
    }

    public function test_deleting_a_missing_category_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/v1/admin/categories/999999')
            ->assertStatus(404);
    }

    public function test_admin_can_reorder_categories(): void
    {
        $first = Category::factory()->create(['sort_order' => 1]);
        $second = Category::factory()->create(['sort_order' => 2]);

        $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/categories/reorder', [
                'items' => [
                    ['id' => $first->id, 'sort_order' => 10],
                    ['id' => $second->id, 'sort_order' => 5],
                ],
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(10, $first->fresh()->sort_order);
        $this->assertSame(5, $second->fresh()->sort_order);
    }

    public function test_reordering_can_move_a_category_under_a_new_parent(): void
    {
        $parent = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => null]);

        $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/categories/reorder', [
                'items' => [['id' => $child->id, 'sort_order' => 1, 'parent_id' => $parent->id]],
            ])
            ->assertStatus(200);

        $this->assertSame($parent->id, $child->fresh()->parent_id);
    }

    public function test_reorder_rejects_a_category_becoming_its_own_parent(): void
    {
        $category = Category::factory()->create(['sort_order' => 3]);

        $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/categories/reorder', [
                'items' => [['id' => $category->id, 'sort_order' => 9, 'parent_id' => $category->id]],
            ])
            ->assertStatus(400);

        // The whole reorder runs in a transaction, so nothing is half-applied.
        $this->assertSame(3, $category->fresh()->sort_order);
    }

    public function test_reorder_validates_its_payload(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/categories/reorder', ['items' => []])
            ->assertStatus(422);

        $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/categories/reorder', [
                'items' => [['id' => 999999, 'sort_order' => 1]],
            ])
            ->assertStatus(422);
    }

    public function test_reorder_requires_an_admin(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->user)
            ->putJson('/api/v1/admin/categories/reorder', [
                'items' => [['id' => $category->id, 'sort_order' => 1]],
            ])
            ->assertStatus(403);
    }

    // ------------------------------------------------------------ admin products

    /**
     * stats() returns per-product statistics but was bound to /admin/products/stats,
     * which passes no id, while /admin/products/{product}/stats - the path the
     * frontend calls - pointed at a productStats() that does not exist.
     */
    public function test_admin_product_stats_resolves_for_a_product(): void
    {
        $product = Product::factory()->create();

        $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/products/{$product->id}/stats")
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    // ------------------------------------------------------------------- chat

    public function test_a_participant_can_open_a_conversation(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        $conversation = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $seller->id,
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/v1/chat/conversations/{$conversation->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_opening_a_conversation_requires_authentication(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        $conversation = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $seller->id,
        ]);

        $this->getJson("/api/v1/chat/conversations/{$conversation->id}")->assertStatus(401);
    }

    // ---------------------------------------------------------- removed routes

    /**
     * These two were bound to missing methods and nothing called them, so the
     * routes were removed rather than given invented behaviour. 405 (not 500)
     * confirms the URI is no longer served for that verb.
     */
    public function test_removed_routes_are_no_longer_registered(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $review = \App\Models\Review::factory()->create([
            'product_id' => $product->id,
            'user_id' => $this->user->id,
        ]);

        $this->actingAs($this->user)
            ->putJson("/api/v1/reviews/{$review->id}", ['rating' => 4])
            ->assertStatus(405);
    }
}
