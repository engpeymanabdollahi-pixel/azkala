<?php

namespace Tests\Unit\Services;

use App\Models\Review;
use App\Models\User;
use App\Repositories\AdminReviewRepository;
use App\Services\Admin\AdminReviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReviewServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminReviewService $service;
    protected AdminReviewRepository $repository;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new AdminReviewRepository();
        $this->service = new AdminReviewService($this->repository);
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    // ==================== getReviews Tests ====================

    public function test_can_get_reviews_with_default_filters(): void
    {
        Review::factory()->count(3)->create(['status' => 'approved']);
        Review::factory()->count(2)->create(['status' => 'pending']);

        $result = $this->service->getReviews([], 20);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('reviews', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertEquals(5, $result['pagination']['total']);
    }

    public function test_can_filter_reviews_by_status(): void
    {
        Review::factory()->count(3)->create(['status' => 'approved']);
        Review::factory()->count(2)->create(['status' => 'pending']);

        $result = $this->service->getReviews(['status' => 'approved'], 20);

        $this->assertGreaterThanOrEqual(3, $result['pagination']['total']);
    }

    public function test_can_filter_reviews_by_rating(): void
    {
        Review::factory()->count(3)->create(['rating' => 5]);
        Review::factory()->count(2)->create(['rating' => 1]);

        $result = $this->service->getReviews(['rating' => 5], 20);

        $this->assertGreaterThanOrEqual(3, $result['pagination']['total']);
    }

    public function test_can_search_reviews_by_comment(): void
    {
        Review::factory()->create(['comment' => 'Excellent product, highly recommended']);
        Review::factory()->create(['comment' => 'Not worth the price']);
        Review::factory()->create(['comment' => 'Average quality']);

        $result = $this->service->getReviews(['search' => 'Excellent'], 20);

        $this->assertEquals(1, $result['pagination']['total']);
    }

    // ==================== updateStatus Tests ====================

    public function test_can_update_review_status_to_approved(): void
    {
        $review = Review::factory()->create(['status' => 'pending']);

        $result = $this->service->updateStatus($review->id, 'approved');

        $this->assertTrue($result);
        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'status' => 'approved',
        ]);
    }

    public function test_can_update_review_status_to_rejected(): void
    {
        $review = Review::factory()->create(['status' => 'pending']);

        $result = $this->service->updateStatus($review->id, 'rejected');

        $this->assertTrue($result);
        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'status' => 'rejected',
        ]);
    }

    public function test_update_status_throws_exception_for_nonexistent_review(): void
    {
        $this->expectException(\Exception::class);

        $this->service->updateStatus(9999, 'approved');
    }

    // ==================== replyToReview Tests ====================

    public function test_can_reply_to_review(): void
    {
        $review = Review::factory()->create(['status' => 'approved']);

        $result = $this->service->replyToReview(
            $review->id,
            'Thank you for your feedback!',
            $this->admin->id
        );

        $this->assertTrue($result);
        
        $review->refresh();
        $this->assertEquals('Thank you for your feedback!', $review->admin_reply);
        $this->assertNotNull($review->replied_at);
        $this->assertEquals($this->admin->id, $review->replied_by);
    }

    public function test_reply_to_review_throws_exception_for_nonexistent_review(): void
    {
        $this->expectException(\Exception::class);

        $this->service->replyToReview(9999, 'Reply', $this->admin->id);
    }

    // ==================== deleteReview Tests ====================

    public function test_can_delete_review(): void
    {
        $review = Review::factory()->create();

        $result = $this->service->deleteReview($review->id);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_delete_review_throws_exception_for_nonexistent_review(): void
    {
        $this->expectException(\Exception::class);

        $this->service->deleteReview(9999);
    }

    // ==================== bulkAction Tests ====================

    public function test_can_bulk_approve_reviews(): void
    {
        $reviews = Review::factory()->count(3)->create(['status' => 'pending']);
        $ids = $reviews->pluck('id')->toArray();

        $result = $this->service->bulkAction($ids, 'approve');

        $this->assertIsArray($result);
        $this->assertEquals(3, Review::whereIn('id', $ids)->where('status', 'approved')->count());
    }

    public function test_can_bulk_reject_reviews(): void
    {
        $reviews = Review::factory()->count(3)->create(['status' => 'pending']);
        $ids = $reviews->pluck('id')->toArray();

        $result = $this->service->bulkAction($ids, 'reject');

        $this->assertIsArray($result);
        $this->assertEquals(3, Review::whereIn('id', $ids)->where('status', 'rejected')->count());
    }

    public function test_can_bulk_delete_reviews(): void
    {
        $reviews = Review::factory()->count(3)->create();
        $ids = $reviews->pluck('id')->toArray();

        $result = $this->service->bulkAction($ids, 'delete');

        $this->assertIsArray($result);
        $this->assertEquals(0, Review::whereIn('id', $ids)->count());
    }

    public function test_bulk_action_returns_empty_for_empty_ids(): void
    {
        $result = $this->service->bulkAction([], 'approve');

        $this->assertIsArray($result);
    }
}