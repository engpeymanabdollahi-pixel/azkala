<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Brand Backend فاز ۰ (بخش Featured Products Cache):
 * ProductService::getFeaturedProducts() نتیجه‌ی کوئری را با کلید
 * 'featured_product_ids_'.$limit به مدت ۳۶۰۰ ثانیه cache می‌کند. قبل از
 * فیکس فاز ۰، هیچ‌کدام از مسیرهای نوشتنِ is_featured/is_active در
 * AdminProductRepository (quickUpdate و ۵ حالت bulkAction) این کش را پاک
 * نمی‌کردند — یعنی بعد از Feature/Unfeature یا Activate/Deactivate یک
 * محصول توسط ادمین، GET /api/v1/products/featured تا پایان TTL همان
 * لیست قدیمی (stale) را برمی‌گرداند.
 *
 * این تست‌ها دقیقاً همین سناریو را بازتولید می‌کنند: اول کش را با یک
 * درخواست GET واقعی پر می‌کنند، بعد از مسیر HTTP ادمین (نه مستقیم از
 * Repository) تغییر می‌دهند، و دوباره GET می‌زنند تا مطمئن شوند پاسخ
 * بلافاصله به‌روز است — نه فقط بعد از انقضای TTL. CACHE_STORE تست‌ها
 * (phpunit.xml) روی 'array' است، پس کش در طول یک تست (یک پردازش PHP)
 * واقعاً پایدار می‌ماند؛ یعنی اگر forgetFeaturedProductsCache() حذف شود
 * این تست‌ها واقعاً fail می‌شوند (نه false-positive).
 */
class FeaturedProductsCacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_unfeaturing_product_via_quick_update_invalidates_featured_cache(): void
    {
        $product = Product::factory()->create([
            'is_featured' => true,
            'is_active' => true,
        ]);

        // پر کردن کش با یک درخواست واقعی
        $before = $this->getJson('/api/v1/products/featured');
        $before->assertStatus(200);
        $this->assertContains($product->id, collect($before->json('data'))->pluck('id')->all());

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/products/{$product->id}/quick-update", ['is_featured' => false])
            ->assertStatus(200);

        $after = $this->getJson('/api/v1/products/featured');
        $after->assertStatus(200);
        $this->assertNotContains($product->id, collect($after->json('data'))->pluck('id')->all());
    }

    public function test_deactivating_featured_product_via_quick_update_invalidates_featured_cache(): void
    {
        $product = Product::factory()->create([
            'is_featured' => true,
            'is_active' => true,
        ]);

        $before = $this->getJson('/api/v1/products/featured');
        $this->assertContains($product->id, collect($before->json('data'))->pluck('id')->all());

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/products/{$product->id}/quick-update", ['is_active' => false])
            ->assertStatus(200);

        $after = $this->getJson('/api/v1/products/featured');
        $this->assertNotContains($product->id, collect($after->json('data'))->pluck('id')->all());
    }

    public function test_bulk_unfeature_invalidates_featured_cache(): void
    {
        $products = Product::factory()->count(2)->create([
            'is_featured' => true,
            'is_active' => true,
        ]);
        $ids = $products->pluck('id')->all();

        $before = $this->getJson('/api/v1/products/featured');
        $beforeIds = collect($before->json('data'))->pluck('id')->all();
        foreach ($ids as $id) {
            $this->assertContains($id, $beforeIds);
        }

        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/products/bulk-action', [
                'ids' => $ids,
                'action' => 'unfeature',
            ])
            ->assertStatus(200);

        $after = $this->getJson('/api/v1/products/featured');
        $afterIds = collect($after->json('data'))->pluck('id')->all();
        foreach ($ids as $id) {
            $this->assertNotContains($id, $afterIds);
        }
    }

    public function test_bulk_deactivate_invalidates_featured_cache(): void
    {
        $products = Product::factory()->count(2)->create([
            'is_featured' => true,
            'is_active' => true,
        ]);
        $ids = $products->pluck('id')->all();

        $before = $this->getJson('/api/v1/products/featured');
        $beforeIds = collect($before->json('data'))->pluck('id')->all();
        foreach ($ids as $id) {
            $this->assertContains($id, $beforeIds);
        }

        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/products/bulk-action', [
                'ids' => $ids,
                'action' => 'deactivate',
            ])
            ->assertStatus(200);

        $after = $this->getJson('/api/v1/products/featured');
        $afterIds = collect($after->json('data'))->pluck('id')->all();
        foreach ($ids as $id) {
            $this->assertNotContains($id, $afterIds);
        }
    }
}
