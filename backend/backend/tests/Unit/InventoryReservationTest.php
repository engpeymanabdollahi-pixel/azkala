<?php

namespace Tests\Unit\Services;

use App\Models\Product;
use App\Models\Order;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryReservationTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(InventoryService::class);
    }

    public function test_reserve_stock_decrements_available_quantity(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);
        $orderId = 1;

        $this->service->reserve($product->id, 3, $orderId);

        $product->refresh();
        $this->assertEquals(7, $product->stock_quantity);
        $this->assertEquals(3, $product->reserved_quantity);
    }

    public function test_release_stock_restores_quantity(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 10, 'reserved_quantity' => 5]);
        
        $this->service->release($product->id, 2);

        $product->refresh();
        $this->assertEquals(12, $product->stock_quantity); // بازگشت به انبار
        $this->assertEquals(3, $product->reserved_quantity);
    }

    public function test_cannot_reserve_more_than_available(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 5]);

        $this->expectException(\App\Exceptions\InsufficientStockException::class);
        
        $this->service->reserve($product->id, 6, 999);
    }
}