<?php

namespace Tests\Unit\Services;

use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\ProductDeviceCompatibility;
use App\Models\User;
use App\Services\CartService;
use App\Exceptions\IncompatibleProductException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartConsistencyTest extends TestCase
{
    use RefreshDatabase;

    private CartService $cartService;
    private User $user;
    private DeviceModel $deviceModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cartService = app(CartService::class);
        $this->user = User::factory()->create();
        $this->deviceModel = DeviceModel::factory()->create();
    }

    public function test_add_to_cart_throws_exception_if_incompatible(): void
    {
        $product = Product::factory()->create(['price' => 100000]);

        $this->expectException(IncompatibleProductException::class);
        $this->expectExceptionMessage('This product is not compatible with your device.');

        $this->cartService->addWithCompatibilityCheck($this->user->id, $product->id, $this->deviceModel->id, 1);
    }

    public function test_add_to_cart_succeeds_if_compatible(): void
    {
        $product = Product::factory()->create(['price' => 100000]);
        ProductDeviceCompatibility::create([
            'product_id' => $product->id,
            'device_model_id' => $this->deviceModel->id
        ]);

        $cartItem = $this->cartService->addWithCompatibilityCheck($this->user->id, $product->id, $this->deviceModel->id, 1);

        $this->assertNotNull($cartItem);
        $this->assertEquals(1, $cartItem->quantity);
        $this->assertEquals(100000, $cartItem->total_price);
    }
}