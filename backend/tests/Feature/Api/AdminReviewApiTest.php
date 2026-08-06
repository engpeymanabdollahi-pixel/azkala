<?php

namespace Tests\Feature\Api;

use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReviewApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_list_reviews(): void
    {
        Review::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reviews');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['reviews', 'pagination', 'stats'],
            ]);
    }

    public function test_non_admin_cannot_list_reviews(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/reviews');

        $response->assertStatus(403);
    }

    /**
     * ✅ قبلاً مقدار خام فیلتر is_verified (که همیشه رشته است، چون از
     * URLSearchParams می‌آید) مستقیم با ستون boolean مقایسه می‌شد. این تست
     * تضمین می‌کند فیلتر با مقدار رشته‌ای "true"/"false" هم درست کار کند.
     */
    public function test_admin_can_filter_reviews_by_verified_status_with_string_values(): void
    {
        Review::factory()->count(2)->create(['is_verified' => true]);
        Review::factory()->create(['is_verified' => false]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reviews?is_verified=true');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 2);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reviews?is_verified=false');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 1);
    }

    public function test_admin_can_update_review_status(): void
    {
        $review = Review::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/reviews/{$review->id}/status", ['status' => 'approved']);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('reviews', ['id' => $review->id, 'status' => 'approved']);
    }

    public function test_admin_can_reply_to_a_review(): void
    {
        $review = Review::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/reviews/{$review->id}/reply", ['reply' => 'متشکریم از نظر شما']);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'admin_reply' => 'متشکریم از نظر شما',
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_bulk_approve_reviews(): void
    {
        $reviews = Review::factory()->count(3)->create(['status' => 'pending']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/reviews/bulk-action', [
                'ids' => $reviews->pluck('id')->toArray(),
                'action' => 'approve',
            ]);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertEquals(3, Review::whereIn('id', $reviews->pluck('id'))->where('status', 'approved')->count());
    }

    public function test_admin_can_delete_a_review(): void
    {
        $review = Review::factory()->create();

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/reviews/{$review->id}");

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertSoftDeleted('reviews', ['id' => $review->id]);
    }

    public function test_admin_can_filter_reviews_by_status(): void
    {
        Review::factory()->count(2)->create(['status' => 'approved']);
        Review::factory()->create(['status' => 'rejected']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reviews?status=approved');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 2);
    }
}
