<?php

namespace Tests\Unit\Services;

use App\Exceptions\IncompatibleProductException;
use App\Exceptions\OutOfStockException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CartService $service;
    protected User $user;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CartService();
        $this->user = User::factory()->create();
        $this->product = Product::factory()->create(['price' => 100000, 'stock' => 10, 'is_active' => true]);
    }

    public function test_can_get_or_create_cart_for_user(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id, 'session-123');

        $this->assertNotNull($cart);
        $this->assertEquals($this->user->id, $cart->user_id);
        $this->assertDatabaseHas('carts', ['user_id' => $this->user->id]);
    }

    public function test_can_add_item_to_cart(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        
        $cartItem = $this->service->addItem($cart, $this->product->id, 2);

        $this->assertNotNull($cartItem);
        $this->assertEquals(2, $cartItem->quantity);
        $this->assertEquals(100000, $cartItem->price);
        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $cart->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
        ]);
    }

    public function test_add_item_throws_exception_if_out_of_stock(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $this->product->update(['stock' => 1]);

        $this->expectException(OutOfStockException::class);
        $this->service->addItem($cart, $this->product->id, 5);
    }

    public function test_add_item_throws_exception_if_incompatible(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $deviceModel = DeviceModel::factory()->create();

        $this->expectException(IncompatibleProductException::class);
        $this->service->addItem($cart, $this->product->id, 1, $deviceModel->id);
    }

    // ✅ Device-First Architecture فاز ۱J: سازگاری محصول↔دستگاه اکنون فقط
    // از طریق device_model_product (رابطه‌ی Product::deviceModels()) چک
    // می‌شود؛ جدول موازیِ قدیمیِ product_device_compatibility دیگر وجود
    // ندارد.
    public function test_add_item_succeeds_if_compatible_via_device_model_product(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $deviceModel = DeviceModel::factory()->create();
        $this->product->deviceModels()->attach($deviceModel->id);

        $item = $this->service->addItem($cart, $this->product->id, 1, $deviceModel->id);

        $this->assertNotNull($item);
        $this->assertEquals($this->product->id, $item->product_id);
    }

    public function test_can_update_item_quantity(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $cartItem = $this->service->addItem($cart, $this->product->id, 1);

        $updatedItem = $this->service->updateItemQuantity($cart, $cartItem->id, 3);

        $this->assertEquals(3, $updatedItem->quantity);
        $this->assertDatabaseHas('cart_items', ['id' => $cartItem->id, 'quantity' => 3]);
    }

    public function test_update_quantity_to_zero_removes_item(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $cartItem = $this->service->addItem($cart, $this->product->id, 2);

        $this->service->updateItemQuantity($cart, $cartItem->id, 0);

        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    public function test_can_remove_item_from_cart(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $cartItem = $this->service->addItem($cart, $this->product->id, 1);

        $result = $this->service->removeItem($cart, $cartItem->id);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    public function test_cart_recalculates_totals_correctly(): void
    {
        $cart = $this->service->getOrCreateCart($this->user->id);
        $this->service->addItem($cart, $this->product->id, 2);

        $cart->refresh();

        $this->assertEquals(2, $cart->items_count);
        $this->assertEquals(200000.00, $cart->subtotal);
        $this->assertEquals(200000.00, $cart->total);
    }
}