<?php

namespace Tests\Unit\Services;

use App\DTOs\Product\ProductFilterDTO;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Repositories\ProductRepository;
use App\Services\Product\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ProductService $service;
    protected ProductRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new ProductRepository();
        $this->service = new ProductService($this->repository);
    }

    // ==================== getProducts Tests ====================

    public function test_can_get_products_with_default_filters(): void
    {
        Product::factory()->count(5)->create(['is_active' => true]);
        Product::factory()->count(3)->create(['is_active' => false]);

        $dto = new ProductFilterDTO();
        $result = $this->service->getProducts($dto);

        $this->assertEquals(5, $result->total());
    }

    public function test_can_filter_products_by_category(): void
    {
        $category = Category::factory()->create();
        Product::factory()->count(3)->create([
            'category_id' => $category->id,
            'is_active' => true,
        ]);
        Product::factory()->count(2)->create(['is_active' => true]);

        $dto = new ProductFilterDTO(category_id: $category->id);
        $result = $this->service->getProducts($dto);

        $this->assertEquals(3, $result->total());
    }

    public function test_can_filter_products_by_brand(): void
    {
        $brand = Brand::factory()->create();
        Product::factory()->count(4)->create([
            'brand_id' => $brand->id,
            'is_active' => true,
        ]);
        Product::factory()->count(2)->create(['is_active' => true]);

        $dto = new ProductFilterDTO(brand_id: $brand->id);
        $result = $this->service->getProducts($dto);

        $this->assertEquals(4, $result->total());
    }

    public function test_can_search_products_by_name(): void
    {
        Product::factory()->create([
            'name' => 'Samsung Galaxy S24 Case',
            'is_active' => true,
        ]);
        Product::factory()->create([
            'name' => 'iPhone 15 Pro Case',
            'is_active' => true,
        ]);
        Product::factory()->create([
            'name' => 'Xiaomi Charger',
            'is_active' => true,
        ]);

        $dto = new ProductFilterDTO(search: 'Samsung');
        $result = $this->service->getProducts($dto);

        $this->assertEquals(1, $result->total());
    }

    public function test_can_filter_products_by_price_range(): void
    {
        Product::factory()->create(['price' => 50000, 'is_active' => true]);
        Product::factory()->create(['price' => 150000, 'is_active' => true]);
        Product::factory()->create(['price' => 250000, 'is_active' => true]);

        $dto = new ProductFilterDTO(min_price: 100000, max_price: 200000);
        $result = $this->service->getProducts($dto);

        $this->assertEquals(1, $result->total());
    }

    public function test_can_sort_products_by_price(): void
    {
        Product::factory()->create(['price' => 100000, 'is_active' => true]);
        Product::factory()->create(['price' => 50000, 'is_active' => true]);
        Product::factory()->create(['price' => 150000, 'is_active' => true]);

        $dto = new ProductFilterDTO(sort_by: 'price', sort_order: 'asc');
        $result = $this->service->getProducts($dto);

        $products = $result->items();
        $this->assertEquals(50000, $products[0]->price);
        $this->assertEquals(150000, $products[2]->price);
    }

    // ==================== getProductById Tests ====================

    public function test_can_get_product_by_id(): void
    {
        $product = Product::factory()->create();

        $result = $this->service->getProductById($product->id);

        $this->assertNotNull($result);
        $this->assertEquals($product->id, $result->id);
    }

    public function test_returns_null_for_nonexistent_product(): void
    {
        $result = $this->service->getProductById(9999);

        $this->assertNull($result);
    }

    // ==================== getProductBySlug Tests ====================

    public function test_can_get_product_by_slug(): void
    {
        $product = Product::factory()->create([
            'slug' => 'samsung-galaxy-s24-case',
        ]);

        $result = $this->service->getProductBySlug('samsung-galaxy-s24-case');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('product', $result);
    }

    public function test_returns_exception_for_nonexistent_slug(): void
    {
        $this->expectException(\Exception::class);

        $this->service->getProductBySlug('nonexistent-slug');
    }

    // ==================== getFeaturedProducts Tests ====================

    public function test_can_get_featured_products(): void
    {
        Product::factory()->count(3)->create([
            'is_featured' => true,
            'is_active' => true,
        ]);
        Product::factory()->count(2)->create([
            'is_featured' => false,
            'is_active' => true,
        ]);

        $result = $this->service->getFeaturedProducts(10);

        $this->assertCount(3, $result);
    }

    public function test_featured_products_respects_limit(): void
    {
        Product::factory()->count(15)->create([
            'is_featured' => true,
            'is_active' => true,
        ]);

        $result = $this->service->getFeaturedProducts(5);

        $this->assertCount(5, $result);
    }

    // ==================== getSpecialOffers Tests ====================

    public function test_can_get_special_offers(): void
    {
        Product::factory()->count(4)->create([
            'is_special_offer' => true,
            'is_active' => true,
        ]);
        Product::factory()->count(3)->create([
            'is_special_offer' => false,
            'is_active' => true,
        ]);

        $result = $this->service->getSpecialOffers(10);

        $this->assertCount(4, $result);
    }

    // ==================== getUserPurchasedProducts Tests ====================

    public function test_can_get_user_purchased_products(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
        ]);
        
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();
        
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product1->id,
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product2->id,
        ]);

        $result = $this->service->getUserPurchasedProducts($user->id);

        $this->assertEquals(2, $result->total());
    }

    public function test_user_purchased_products_includes_all_orders(): void
    {
        $user = User::factory()->create();
        
        $completedOrder = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
        ]);
        
        $pendingOrder = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();
        
        OrderItem::factory()->create([
            'order_id' => $completedOrder->id,
            'product_id' => $product1->id,
        ]);
        OrderItem::factory()->create([
            'order_id' => $pendingOrder->id,
            'product_id' => $product2->id,
        ]);

        $result = $this->service->getUserPurchasedProducts($user->id);

        // Service ظ‡ظ…ظ‡ ظ…ط­طµظˆظ„ط§طھ ط§ط² ظ‡ظ…ظ‡ ط³ظپط§ط±ط´ط§طھ ط±ط§ ط¨ط±ظ…غŒâ€Œع¯ط±ط¯ط§ظ†ط¯
        $this->assertEquals(2, $result->total());
    }
}