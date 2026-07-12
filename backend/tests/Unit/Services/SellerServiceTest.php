<?php

namespace Tests\Unit\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SellerQuickReply;
use App\Models\User;
use App\Repositories\SellerRepository;
use App\Services\Seller\SellerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SellerService $service;
    protected SellerRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new SellerRepository();
        $this->service = new SellerService($this->repository);
    }

    // ==================== getSellerProducts Tests ====================

    public function test_can_get_seller_products(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        Product::factory()->count(5)->create(['seller_id' => $seller->id]);

        $result = $this->service->getSellerProducts($seller->id);

        $this->assertEquals(5, $result->total());
    }

    public function test_seller_products_only_shows_own_products(): void
    {
        $seller1 = User::factory()->create(['role' => 'seller']);
        $seller2 = User::factory()->create(['role' => 'seller']);
        
        Product::factory()->count(3)->create(['seller_id' => $seller1->id]);
        Product::factory()->count(2)->create(['seller_id' => $seller2->id]);

        $result = $this->service->getSellerProducts($seller1->id);

        $this->assertEquals(3, $result->total());
    }

    // ==================== getSellerDashboardStats Tests ====================

    public function test_can_get_seller_dashboard_stats(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        Product::factory()->count(10)->create(['seller_id' => $seller->id]);

        $stats = $this->service->getSellerDashboardStats($seller->id);

        $this->assertIsArray($stats);
        $this->assertNotEmpty($stats);
    }
    // ==================== getSellerRatings Tests ====================

    public function test_can_get_seller_ratings(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $buyer = User::factory()->create(['role' => 'customer']);
        
        $order = Order::factory()->create([
            'user_id' => $buyer->id,
            'status' => 'completed',
        ]);
        
        $product = Product::factory()->create(['seller_id' => $seller->id]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
        ]);

        // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ§ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ¥ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط£آ¢أ¢â‚¬â€چط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¬ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ§ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¯ ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ§ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â€ڑآ¬ط¹â€کط·آ¢ط¢آ¬ط·آ·ط¢آ¢ط·آ¢ط¢آ¦ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¹ط·آ·ط¢آ¢ط·آ¢ط¢آ¾ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ·ط£آ¢أ¢â€ڑآ¬ط·â€؛ط·آ·ط¢آ·ط·آ¢ط¢آ¥ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط£آ¢أ¢â‚¬â€چط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ§ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ²
        \App\Models\SellerRating::factory()->create([
            'user_id' => $buyer->id,
            'seller_id' => $seller->id,
            'order_id' => $order->id,
            'overall_rating' => 5.0,
            'comment' => 'Excellent service!',
        ]);

        $result = $this->service->getSellerRatings($seller->id);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('ratings', $result);
        $this->assertArrayHasKey('average_rating', $result);
        $this->assertEquals(5.0, $result['average_rating']);
    }


    // ==================== createProduct Tests ====================

    public function test_can_create_product(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $category = \App\Models\Category::factory()->create();
        $brand = \App\Models\Brand::factory()->create();

        $data = [
            'name' => 'Test Product',
            'slug' => 'test-product',
            'description' => 'Test Description',
            'price' => 100000,
            'stock' => 50,
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_active' => true,
        ];

        $product = $this->service->createProduct($seller->id, $data);

        $this->assertInstanceOf(Product::class, $product);
        $this->assertEquals('Test Product', $product->name);
        $this->assertEquals($seller->id, $product->seller_id);
    }

    // ==================== updateProduct Tests ====================

    public function test_can_update_product(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create([
            'seller_id' => $seller->id,
            'name' => 'Old Name',
        ]);

        $updated = $this->service->updateProduct($product->id, $seller->id, ['name' => 'New Name']);

        $this->assertEquals('New Name', $updated->name);
    }

    // ==================== deleteProduct Tests ====================

    public function test_can_delete_product(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        $result = $this->service->deleteProduct($product->id, $seller->id);

        $this->assertTrue($result);
    }

    // ==================== createQuickReply Tests ====================

    public function test_can_create_quick_reply(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $result = $this->service->createQuickReply(
            $seller->id,
            'Welcome Message',
            'Thank you for your order!'
        );

        $this->assertInstanceOf(SellerQuickReply::class, $result);
        $this->assertEquals('Welcome Message', $result->title);
    }
}