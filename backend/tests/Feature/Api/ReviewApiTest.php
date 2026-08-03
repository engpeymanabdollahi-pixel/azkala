<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewApiTest extends TestCase
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

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'product_id' => $this->product->id,
            'rating' => 5,
            'title' => 'عالی بود',
            'comment' => 'کیفیت محصول واقعاً خوب بود و سریع رسید.',
        ], $overrides);
    }

    public function test_review_list_is_public_and_only_shows_approved(): void
    {
        Review::factory()->create([
            'product_id' => $this->product->id,
            'status' => 'approved',
            'comment' => 'نظر تاییدشده',
        ]);
        Review::factory()->create([
            'product_id' => $this->product->id,
            'status' => 'pending',
            'comment' => 'نظر در انتظار',
        ]);

        $response = $this->getJson("/api/v1/products/{$this->product->id}/reviews");

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertCount(1, $response->json('data.reviews'));
        $this->assertSame('نظر تاییدشده', $response->json('data.reviews.0.comment'));
    }

    public function test_review_summary_averages_only_approved_reviews(): void
    {
        Review::factory()->create(['product_id' => $this->product->id, 'status' => 'approved', 'rating' => 4]);
        Review::factory()->create(['product_id' => $this->product->id, 'status' => 'approved', 'rating' => 2]);
        // A rejected 5-star review must not pull the average up.
        Review::factory()->create(['product_id' => $this->product->id, 'status' => 'rejected', 'rating' => 5]);

        $response = $this->getJson("/api/v1/products/{$this->product->id}/reviews");

        $response->assertStatus(200);
        $this->assertSame(3.0, (float) $response->json('data.summary.average_rating'));
        $this->assertSame(2, $response->json('data.summary.total_reviews'));
    }

    public function test_unauthenticated_user_cannot_post_a_review(): void
    {
        $this->postJson('/api/v1/reviews', $this->validPayload())->assertStatus(401);
    }

    public function test_user_can_post_a_review(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/reviews', $this->validPayload())
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'pending', // new reviews await moderation
        ]);
    }

    public function test_user_cannot_review_the_same_product_twice(): void
    {
        Review::factory()->create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/reviews', $this->validPayload())
            ->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertSame(1, Review::where('user_id', $this->user->id)->count());
    }

    public function test_posting_a_review_validates_its_input(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/reviews', $this->validPayload(['rating' => 9]))
            ->assertStatus(422);

        $this->actingAs($this->user)
            ->postJson('/api/v1/reviews', $this->validPayload(['comment' => 'کوتاه']))
            ->assertStatus(422);
    }

    public function test_a_review_from_a_buyer_is_marked_verified(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'delivered',
            'payment_status' => 'paid',
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/reviews', $this->validPayload())
            ->assertStatus(201);

        $this->assertTrue((bool) Review::where('user_id', $this->user->id)->first()->is_verified);
    }

    public function test_a_review_without_a_purchase_is_not_verified(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/reviews', $this->validPayload())
            ->assertStatus(201);

        $this->assertFalse((bool) Review::where('user_id', $this->user->id)->first()->is_verified);
    }

    public function test_user_can_delete_own_review(): void
    {
        $review = Review::factory()->create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('reviews', ['id' => $review->id]);
    }

    public function test_user_cannot_delete_another_users_review(): void
    {
        $review = Review::factory()->create([
            'user_id' => $this->otherUser->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertStatus(500); // controller maps ownership failure to its generic handler

        $this->assertNotSoftDeleted('reviews', ['id' => $review->id]);
    }

    public function test_helpful_count_increments(): void
    {
        $review = Review::factory()->create([
            'product_id' => $this->product->id,
            'helpful_count' => 3,
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/v1/reviews/{$review->id}/helpful")
            ->assertStatus(200)
            ->assertJsonPath('data.helpful_count', 4);
    }

    public function test_can_review_requires_authentication(): void
    {
        $this->getJson("/api/v1/products/{$this->product->id}/can-review")
            ->assertStatus(401);
    }

    public function test_can_review_reports_purchase_state(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'delivered',
            'payment_status' => 'paid',
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/v1/products/{$this->product->id}/can-review")
            ->assertStatus(200)
            ->assertJsonPath('has_purchased', true);

        $this->actingAs($this->otherUser)
            ->getJson("/api/v1/products/{$this->product->id}/can-review")
            ->assertStatus(200)
            ->assertJsonPath('has_purchased', false);
    }
}
