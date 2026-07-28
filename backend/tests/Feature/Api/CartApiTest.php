<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartApiTest extends TestCase
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
        $this->product = Product::factory()->create(['price' => 50000, 'stock' => 10, 'is_active' => true]);
    }

    public function test_unauthenticated_user_cannot_access_cart(): void
    {
        $response = $this->getJson('/api/v1/cart');
        $response->assertStatus(401);
    }

    public function test_user_can_view_empty_cart(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/cart');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_user_can_add_item_to_cart(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/cart', [
                'product_id' => $this->product->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.product_id', $this->product->id)
            ->assertJsonPath('data.quantity', 2);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
        ]);
    }

    public function test_user_cannot_add_out_of_stock_item(): void
    {
        $this->product->update(['stock' => 1]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/cart', [
                'product_id' => $this->product->id,
                'quantity' => 5,
            ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    public function test_user_can_update_item_quantity(): void
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'price' => 50000,
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/v1/cart/{$cartItem->id}", [
                'quantity' => 3,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.quantity', 3);
    }

    public function test_user_cannot_update_item_beyond_stock(): void
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'price' => 50000,
        ]);
        $this->product->update(['stock' => 2]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/v1/cart/{$cartItem->id}", [
                'quantity' => 5,
            ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    public function test_user_can_remove_item_from_cart(): void
    {
        $cart = Cart::create(['user_id' => $this->user->id]);
        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'price' => 50000,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/v1/cart/{$cartItem->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    public function test_user_cannot_remove_item_from_another_users_cart(): void
    {
        $cart = Cart::create(['user_id' => $this->otherUser->id]);
        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'price' => 50000,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/v1/cart/{$cartItem->id}");

        // کنترلر باید 404 برگرداند چون آیتم در سبد این کاربر یافت نمی‌شود
        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }
}