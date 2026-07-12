<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\ProductSuggestionService;
use App\Models\Conversation;
use App\Models\Product;
use App\Models\ProductSuggestion;
use App\Models\User;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductSuggestionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;
    protected $seller;
    protected $buyer;
    protected $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new ProductSuggestionService();
        
        $this->seller = User::factory()->create(['role' => 'seller']);
        $this->buyer = User::factory()->create(['role' => 'customer']);
        $this->category = Category::factory()->create();
    }

    // ==================== suggestProducts Tests ====================

    public function test_suggests_similar_products_when_product_exists(): void
    {
        $mainProduct = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'category_id' => $this->category->id,
            'is_active' => true,
            'stock' => 10,
            'sales_count' => 0,
        ]);

        $similarProduct1 = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'category_id' => $this->category->id,
            'is_active' => true,
            'stock' => 5,
            'sales_count' => 50,
        ]);

        $similarProduct2 = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'category_id' => $this->category->id,
            'is_active' => true,
            'stock' => 3,
            'sales_count' => 30,
        ]);

        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => $mainProduct->id,
            'last_message_at' => now(),
        ]);

        // limit = 2 تا فقط محصولات مشابه برگرداند
        $suggestions = $this->service->suggestProducts($conversation, 2);

        $this->assertCount(2, $suggestions);
        $this->assertEquals(0.9, $suggestions[0]['score']);
        $this->assertStringContainsString('مشابه', $suggestions[0]['reason']);
    }

    public function test_suggests_top_products_when_no_product_in_conversation(): void
    {
        $topProduct1 = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 10,
            'sales_count' => 100,
        ]);

        $topProduct2 = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 5,
            'sales_count' => 50,
        ]);

        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => null,
            'last_message_at' => now(),
        ]);

        $suggestions = $this->service->suggestProducts($conversation, 5);

        $this->assertCount(2, $suggestions);
        $this->assertEquals(0.7, $suggestions[0]['score']);
        $this->assertStringContainsString('پرفروش', $suggestions[0]['reason']);
    }

    public function test_respects_limit_parameter(): void
    {
        for ($i = 0; $i < 10; $i++) {
            Product::factory()->create([
                'seller_id' => $this->seller->id,
                'is_active' => true,
                'stock' => 10,
                'sales_count' => 100 - $i,
            ]);
        }

        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => null,
            'last_message_at' => now(),
        ]);

        $suggestions = $this->service->suggestProducts($conversation, 3);

        $this->assertCount(3, $suggestions);
    }

    public function test_excludes_inactive_products(): void
    {
        Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => false,
            'stock' => 10,
        ]);

        Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 10,
            'sales_count' => 50,
        ]);

        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => null,
            'last_message_at' => now(),
        ]);

        $suggestions = $this->service->suggestProducts($conversation, 5);

        $this->assertCount(1, $suggestions);
    }

    public function test_excludes_out_of_stock_products(): void
    {
        Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 0,
        ]);

        Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 10,
            'sales_count' => 50,
        ]);

        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => null,
            'last_message_at' => now(),
        ]);

        $suggestions = $this->service->suggestProducts($conversation, 5);

        $this->assertCount(1, $suggestions);
    }

    public function test_returns_empty_when_no_products_available(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => null,
            'last_message_at' => now(),
        ]);

        $suggestions = $this->service->suggestProducts($conversation, 5);

        $this->assertCount(0, $suggestions);
    }

    public function test_orders_by_sales_count(): void
    {
        $product1 = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 10,
            'sales_count' => 50,
        ]);

        $product2 = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'is_active' => true,
            'stock' => 10,
            'sales_count' => 100,
        ]);

        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'product_id' => null,
            'last_message_at' => now(),
        ]);

        $suggestions = $this->service->suggestProducts($conversation, 5);

        $this->assertEquals($product2->id, $suggestions[0]['product']->id);
        $this->assertEquals($product1->id, $suggestions[1]['product']->id);
    }

    // ==================== saveSuggestion Tests ====================

    public function test_can_save_suggestion(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $product = Product::factory()->create(['seller_id' => $this->seller->id]);

        $suggestion = $this->service->saveSuggestion(
            $conversation->id,
            $product->id,
            $this->seller->id,
            'auto',
            0.9
        );

        $this->assertInstanceOf(ProductSuggestion::class, $suggestion);
        $this->assertEquals($conversation->id, $suggestion->conversation_id);
        $this->assertEquals($product->id, $suggestion->product_id);
        $this->assertEquals($this->seller->id, $suggestion->suggested_by);
        $this->assertEquals('auto', $suggestion->source);
        $this->assertEquals(0.9, $suggestion->relevance_score);
    }

    public function test_save_suggestion_with_default_values(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $product = Product::factory()->create(['seller_id' => $this->seller->id]);

        $suggestion = $this->service->saveSuggestion(
            $conversation->id,
            $product->id,
            $this->seller->id
        );

        $this->assertEquals('auto', $suggestion->source);
        $this->assertEquals(0.0, $suggestion->relevance_score);
    }

    // ==================== markAsClicked Tests ====================

    public function test_can_mark_suggestion_as_clicked(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $product = Product::factory()->create(['seller_id' => $this->seller->id]);

        $suggestion = ProductSuggestion::create([
            'conversation_id' => $conversation->id,
            'product_id' => $product->id,
            'suggested_by' => $this->seller->id,
            'is_clicked' => false,
        ]);

        $this->service->markAsClicked($suggestion->id);

        $suggestion->refresh();
        $this->assertTrue($suggestion->is_clicked);
    }

    public function test_mark_as_clicked_with_nonexistent_id(): void
    {
        $this->service->markAsClicked(99999);
        $this->assertTrue(true);
    }

    // ==================== markAsPurchased Tests ====================

    public function test_can_mark_suggestion_as_purchased(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $product = Product::factory()->create(['seller_id' => $this->seller->id]);

        $suggestion = ProductSuggestion::create([
            'conversation_id' => $conversation->id,
            'product_id' => $product->id,
            'suggested_by' => $this->seller->id,
            'is_purchased' => false,
        ]);

        $this->service->markAsPurchased($suggestion->id);

        $suggestion->refresh();
        $this->assertTrue($suggestion->is_purchased);
    }

    public function test_mark_as_purchased_with_nonexistent_id(): void
    {
        $this->service->markAsPurchased(99999);
        $this->assertTrue(true);
    }

    // ==================== getSellerStats Tests ====================

    public function test_can_get_seller_stats(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $product = Product::factory()->create(['seller_id' => $this->seller->id]);

        for ($i = 0; $i < 10; $i++) {
            ProductSuggestion::create([
                'conversation_id' => $conversation->id,
                'product_id' => $product->id,
                'suggested_by' => $this->seller->id,
                'is_clicked' => $i < 5,
                'is_purchased' => $i < 2,
            ]);
        }

        $stats = $this->service->getSellerStats($this->seller->id);

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total', $stats);
        $this->assertArrayHasKey('clicked', $stats);
        $this->assertArrayHasKey('purchased', $stats);
        $this->assertArrayHasKey('click_rate', $stats);
        $this->assertArrayHasKey('conversion_rate', $stats);

        $this->assertEquals(10, $stats['total']);
        $this->assertEquals(5, $stats['clicked']);
        $this->assertEquals(2, $stats['purchased']);
        $this->assertEquals(50.0, $stats['click_rate']);
        $this->assertEquals(20.0, $stats['conversion_rate']);
    }

    public function test_get_seller_stats_with_no_suggestions(): void
    {
        $stats = $this->service->getSellerStats($this->seller->id);

        $this->assertEquals(0, $stats['total']);
        $this->assertEquals(0, $stats['clicked']);
        $this->assertEquals(0, $stats['purchased']);
        $this->assertEquals(0, $stats['click_rate']);
        $this->assertEquals(0, $stats['conversion_rate']);
    }

    public function test_get_seller_stats_only_counts_seller_suggestions(): void
    {
        $otherSeller = User::factory()->create(['role' => 'seller']);
        
        $conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $product = Product::factory()->create(['seller_id' => $this->seller->id]);

        ProductSuggestion::create([
            'conversation_id' => $conversation->id,
            'product_id' => $product->id,
            'suggested_by' => $this->seller->id,
        ]);

        ProductSuggestion::create([
            'conversation_id' => $conversation->id,
            'product_id' => $product->id,
            'suggested_by' => $otherSeller->id,
        ]);

        $stats = $this->service->getSellerStats($this->seller->id);

        $this->assertEquals(1, $stats['total']);
    }
}