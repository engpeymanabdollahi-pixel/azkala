<?php

namespace Tests\Feature;

use App\Models\DeviceModel;
use App\Models\MagazineArticle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Test برای Magazine API
 * 
 * تست کامل public و admin endpoints
 */
class MagazineApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $customer;
    private DeviceModel $device;

    protected function setUp(): void
    {
        parent::setUp();

        // ساخت کاربر ادمین و مشتری
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->customer = User::factory()->create(['role' => 'customer']);
        
        // ساخت یک دستگاه تست
        $this->device = DeviceModel::factory()->create();
    }

    /**
     * Helper: ساخت مقاله تست
     */
    private function createTestArticle(array $overrides = []): MagazineArticle
    {
        return MagazineArticle::create(array_merge([
            'slug' => 'test-article-' . uniqid(),
            'title' => 'مقاله تست',
            'excerpt' => 'خلاصه مقاله تست',
            'content' => '<p>محتوای کامل</p>',
            'category' => 'news',
            'is_published' => true,
            'content_source' => 'admin',
            'published_at' => now(),
            'author_id' => $this->admin->id,
        ], $overrides));
    }

    // ==================== Public Endpoints ====================

    public function test_guest_can_view_magazine_list(): void
    {
        // ایجاد ۵ مقاله published
        for ($i = 1; $i <= 5; $i++) {
            $this->createTestArticle([
                'slug' => "article-$i",
                'title' => "مقاله $i",
            ]);
        }
        
        // یک مقاله unpublished هم بسازیم (نباید نمایش داده شود)
        $this->createTestArticle([
            'slug' => 'unpublished',
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/magazine');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                 ])
                 ->assertJsonCount(5, 'data')
                 ->assertJsonPath('meta.total', 5);
    }

    public function test_guest_can_view_magazine_stats(): void
    {
        $this->createTestArticle();

        $response = $this->getJson('/api/v1/magazine/stats');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'total_articles' => 1,
                     ],
                 ]);
    }

    public function test_guest_can_view_article_details(): void
    {
        $article = $this->createTestArticle([
            'slug' => 'test-details',
            'title' => 'مقاله با جزئیات',
        ]);

        $response = $this->getJson('/api/v1/magazine/test-details');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'slug' => 'test-details',
                         'title' => 'مقاله با جزئیات',
                     ],
                 ])
                 ->assertJsonStructure([
                     'data' => ['content', 'source', 'category', 'stats'],
                     'related',
                 ]);
    }

    public function test_guest_cannot_view_unpublished_article(): void
    {
        $this->createTestArticle([
            'slug' => 'unpublished-article',
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/magazine/unpublished-article');

        $response->assertStatus(404);
    }

    public function test_guest_can_filter_by_category(): void
    {
        $this->createTestArticle(['category' => 'news', 'slug' => 'news-1']);
        $this->createTestArticle(['category' => 'review', 'slug' => 'review-1']);
        $this->createTestArticle(['category' => 'news', 'slug' => 'news-2']);

        $response = $this->getJson('/api/v1/magazine?category=news');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');
    }

    public function test_guest_can_search_articles(): void
    {
        $this->createTestArticle(['title' => 'بررسی iPhone 15', 'slug' => 'iphone']);
        $this->createTestArticle(['title' => 'بررسی Galaxy S24', 'slug' => 'galaxy']);

        $response = $this->getJson('/api/v1/magazine?search=iPhone');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.title', 'بررسی iPhone 15');
    }

    public function test_guest_can_view_featured_articles(): void
    {
        $this->createTestArticle(['view_count' => 100, 'slug' => 'popular']);
        $this->createTestArticle(['view_count' => 50, 'slug' => 'medium']);
        $this->createTestArticle(['view_count' => 10, 'slug' => 'low']);

        $response = $this->getJson('/api/v1/magazine/featured?limit=2');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data')
                 ->assertJsonPath('data.0.title', function ($title) {
                     return $title === 'مقاله تست'; // همه عنوان یکسان دارند
                 });
    }

    public function test_guest_can_view_device_news(): void
    {
        $article = $this->createTestArticle(['slug' => 'device-news']);
        $article->devices()->attach($this->device->id, ['relevance_score' => 100]);

        $response = $this->getJson("/api/v1/magazine/device/{$this->device->id}/news");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'count' => 1,
                 ]);
    }

    public function test_guest_cannot_access_admin_endpoints(): void
    {
        $response = $this->getJson('/api/v1/admin/magazine');

        // باید 401 یا 403 برگردد
        $this->assertTrue(
            in_array($response->getStatusCode(), [401, 403]),
            'Admin endpoints should require authentication'
        );
    }

    // ==================== Admin Endpoints ====================

    public function test_admin_can_view_all_articles(): void
    {
        $this->createTestArticle(['slug' => 'admin-1']);
        $this->createTestArticle(['slug' => 'admin-2', 'is_published' => false]);

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/v1/admin/magazine');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                 ])
                 ->assertJsonPath('meta.total', 2); // هر دو (شامل unpublished)
    }

    public function test_admin_can_create_article(): void
    {
        $data = [
            'title' => 'مقاله جدید ادمین',
            'excerpt' => 'خلاصه مقاله',
            'content' => '<p>محتوای کامل</p>',
            'category' => 'review',
            'devices' => [
                ['device_id' => $this->device->id, 'relevance_score' => 90],
            ],
        ];

        $response = $this->actingAs($this->admin)
                         ->postJson('/api/v1/admin/magazine', $data);

        $response->assertStatus(201)
                 ->assertJson([
                     'success' => true,
                     'message' => 'مقاله با موفقیت ایجاد شد',
                 ]);

        $this->assertDatabaseHas('magazine_articles', [
            'title' => 'مقاله جدید ادمین',
            'author_id' => $this->admin->id,
        ]);
    }

    public function test_admin_can_update_article(): void
    {
        $article = $this->createTestArticle(['slug' => 'update-test']);

        $response = $this->actingAs($this->admin)
                         ->putJson("/api/v1/admin/magazine/{$article->id}", [
                             'title' => 'عنوان به‌روزرسانی شده',
                         ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                 ]);

        $this->assertDatabaseHas('magazine_articles', [
            'id' => $article->id,
            'title' => 'عنوان به‌روزرسانی شده',
        ]);
    }

    public function test_admin_can_toggle_article(): void
    {
        $article = $this->createTestArticle(['is_published' => true]);

        $response = $this->actingAs($this->admin)
                         ->postJson("/api/v1/admin/magazine/{$article->id}/toggle");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'is_published' => false,
                     ],
                 ]);
    }

    public function test_admin_can_delete_article(): void
    {
        $article = $this->createTestArticle(['slug' => 'delete-test']);

        $response = $this->actingAs($this->admin)
                         ->deleteJson("/api/v1/admin/magazine/{$article->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                 ]);

        // Soft delete: در جدول هست ولی deleted_at set شده
        $this->assertSoftDeleted('magazine_articles', ['id' => $article->id]);
    }

    public function test_admin_can_bulk_action(): void
    {
        $article1 = $this->createTestArticle(['is_published' => false]);
        $article2 = $this->createTestArticle(['is_published' => false]);

        $response = $this->actingAs($this->admin)
                         ->postJson('/api/v1/admin/magazine/bulk-action', [
                             'action' => 'publish',
                             'ids' => [$article1->id, $article2->id],
                         ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'affected_count' => 2,
                     ],
                 ]);

        $this->assertDatabaseHas('magazine_articles', ['id' => $article1->id, 'is_published' => true]);
        $this->assertDatabaseHas('magazine_articles', ['id' => $article2->id, 'is_published' => true]);
    }

    public function test_admin_can_view_stats(): void
    {
        $this->createTestArticle(['category' => 'news']);
        $this->createTestArticle(['category' => 'review']);

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/v1/admin/magazine/stats');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'total' => 2,
                         'by_category' => [
                             'news' => 1,
                             'review' => 1,
                         ],
                     ],
                 ]);
    }

    public function test_customer_cannot_access_admin_magazine(): void
    {
        $response = $this->actingAs($this->customer)
                         ->getJson('/api/v1/admin/magazine');

        // باید 403 برگردد (کاربر customer دسترسی ادمین ندارد)
        $response->assertStatus(403);
    }

    public function test_admin_cannot_create_article_without_title(): void
    {
        $response = $this->actingAs($this->admin)
                         ->postJson('/api/v1/admin/magazine', [
                             'category' => 'news',
                             'content' => 'محتوا',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['title']);
    }

    public function test_admin_cannot_create_article_with_invalid_category(): void
    {
        $response = $this->actingAs($this->admin)
                         ->postJson('/api/v1/admin/magazine', [
                             'title' => 'عنوان',
                             'category' => 'invalid_category',
                             'content' => 'محتوا',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['category']);
    }
}