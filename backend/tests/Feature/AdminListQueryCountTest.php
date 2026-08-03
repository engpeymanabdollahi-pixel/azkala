<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Admin\AdminOrderService;
use App\Services\Admin\AdminProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use ReflectionMethod;
use Tests\TestCase;

/**
 * The admin listings formatted each row by running fresh queries for it:
 * AdminProductService::formatProduct called getSellerInfo() per product, and
 * AdminOrderService::formatOrder called getOrderSellers() plus
 * getOrderItemsCount() per order - three separate N+1s. The responses are
 * identical either way, so only counting queries can catch a regression.
 *
 * Both formatters now read from the eager-loaded relation when it is present
 * and keep the per-row queries as a fallback for callers that pass a bare
 * model. The last test pins those two paths to the same output, since a
 * divergence there would silently change the admin API.
 */
class AdminListQueryCountTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The first authenticated request of a test also writes last_seen_at via the
     * UpdateLastSeen middleware, which would make the baseline one query larger
     * than every later measurement. Warm up so both samples are in the same state.
     */
    private function warmUp(callable $call): void
    {
        $call();
    }

    private function queryCount(callable $call): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $call();
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    }

    public function test_admin_product_list_query_count_does_not_grow_with_the_number_of_products(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        Product::factory()->count(2)->create(['seller_id' => $seller->id]);
        $this->warmUp(fn () => $this->actingAs($admin)->getJson('/api/v1/admin/products?per_page=50'));
        $few = $this->queryCount(
            fn () => $this->actingAs($admin)->getJson('/api/v1/admin/products?per_page=50')->assertStatus(200)
        );

        Product::factory()->count(18)->create(['seller_id' => $seller->id]);
        $many = $this->queryCount(
            fn () => $this->actingAs($admin)->getJson('/api/v1/admin/products?per_page=50')->assertStatus(200)
        );

        $this->assertSame($few, $many, "GET /admin/products: {$few} queries for 2 products, {$many} for 20.");
    }

    public function test_admin_order_list_query_count_does_not_grow_with_the_number_of_orders(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        $makeOrders = function (int $n) use ($seller) {
            for ($i = 0; $i < $n; $i++) {
                $order = Order::factory()->create(['user_id' => User::factory()->create()->id]);
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'seller_id' => $seller->id,
                    'product_id' => Product::factory()->create(['seller_id' => $seller->id])->id,
                ]);
            }
        };

        $makeOrders(2);
        $this->warmUp(fn () => $this->actingAs($admin)->getJson('/api/v1/admin/orders?per_page=50'));
        $few = $this->queryCount(
            fn () => $this->actingAs($admin)->getJson('/api/v1/admin/orders?per_page=50')->assertStatus(200)
        );

        $makeOrders(10);
        $many = $this->queryCount(
            fn () => $this->actingAs($admin)->getJson('/api/v1/admin/orders?per_page=50')->assertStatus(200)
        );

        $this->assertSame($few, $many, "GET /admin/orders: {$few} queries for 2 orders, {$many} for 12.");
    }

    public function test_eager_and_per_row_formatting_produce_the_same_output(): void
    {
        $withShop = User::factory()->create(['role' => 'seller', 'name' => 'فروشنده الف', 'shop_name' => 'مغازه الف']);
        // shop_name null exercises the "shop_name ?? name" fallback on both paths.
        $noShop = User::factory()->create(['role' => 'seller', 'name' => 'فروشنده ب', 'shop_name' => null]);

        $order = Order::factory()->create(['user_id' => User::factory()->create()->id]);
        // Two items from the same seller check that sellers are de-duplicated.
        foreach ([[$withShop, 3], [$noShop, 5], [$withShop, 2]] as [$seller, $quantity]) {
            OrderItem::factory()->create([
                'order_id' => $order->id,
                'seller_id' => $seller->id,
                'quantity' => $quantity,
                'product_id' => Product::factory()->create(['seller_id' => $seller->id])->id,
            ]);
        }

        $orderService = app(AdminOrderService::class);
        $formatOrder = new ReflectionMethod($orderService, 'formatOrder');
        $formatOrder->setAccessible(true);

        $perRow = $formatOrder->invoke($orderService, Order::find($order->id));
        $eager = $formatOrder->invoke($orderService, Order::with(['items', 'items.seller'])->find($order->id));

        $this->assertSame(10, $perRow['items_count'], 'fixture should total 10 units');
        $this->assertSame($perRow['items_count'], $eager['items_count']);
        $this->assertSame(
            collect($perRow['sellers'])->values()->toArray(),
            collect($eager['sellers'])->values()->toArray()
        );

        $productService = app(AdminProductService::class);
        $formatProduct = new ReflectionMethod($productService, 'formatProduct');
        $formatProduct->setAccessible(true);

        $product = Product::factory()->create(['seller_id' => $noShop->id]);

        $this->assertSame(
            $formatProduct->invoke($productService, Product::find($product->id))['seller'],
            $formatProduct->invoke($productService, Product::with('seller')->find($product->id))['seller']
        );
    }
}
