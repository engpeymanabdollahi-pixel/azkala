<?php

namespace Tests\Unit\Services;

use App\Models\Brand;
use App\Models\User;
use App\Repositories\AdminBrandRepository;
use App\Services\Admin\AdminBrandService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBrandServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminBrandService $service;
    protected AdminBrandRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new AdminBrandRepository();
        $this->service = new AdminBrandService($this->repository);
    }

    public function test_can_get_brands_with_default_filters(): void
    {
        Brand::factory()->count(3)->create(['is_active' => true]);
        Brand::factory()->count(2)->create(['is_active' => false]);

        $result = $this->service->getBrands([], 20);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('brands', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertArrayHasKey('stats', $result);
        $this->assertArrayHasKey('countries', $result);
        $this->assertEquals(5, $result['pagination']['total']);
    }

    public function test_can_filter_brands_by_active_status(): void
    {
        Brand::factory()->count(3)->create(['is_active' => true]);
        Brand::factory()->count(2)->create(['is_active' => false]);

        $result = $this->service->getBrands(['is_active' => true], 20);

        $this->assertEquals(3, $result['pagination']['total']);
    }

    public function test_can_search_brands_by_name(): void
    {
        Brand::factory()->create(['name' => 'Samsung', 'slug' => 'samsung']);
        Brand::factory()->create(['name' => 'Apple', 'slug' => 'apple']);
        Brand::factory()->create(['name' => 'Xiaomi', 'slug' => 'xiaomi']);

        $result = $this->service->getBrands(['search' => 'Samsung'], 20);

        $this->assertEquals(1, $result['pagination']['total']);
        
        // âœ… ط§طµظ„ط§ط­: طھط¨ط¯غŒظ„ ط¨ظ‡ Collection
        $this->assertEquals('Samsung', $result['brands'][0]['name']);
    }

    public function test_can_create_a_brand(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $data = [
            'name' => 'Test Brand',
            'slug' => 'test-brand',
            'description' => 'Test Description',
            'country' => 'Iran',
            'is_active' => true,
        ];

        $brand = $this->service->createBrand($data);

        $this->assertInstanceOf(Brand::class, $brand);
        $this->assertEquals('Test Brand', $brand->name);
        $this->assertEquals('test-brand', $brand->slug);
        $this->assertDatabaseHas('brands', ['name' => 'Test Brand']);
    }

    public function test_generates_unique_slug_for_brand(): void
    {
        Brand::factory()->create(['name' => 'Samsung', 'slug' => 'samsung']);

        $slug = $this->repository->generateUniqueSlug('Samsung');

        $this->assertEquals('samsung-1', $slug);
    }

    public function test_can_update_a_brand(): void
    {
        $brand = Brand::factory()->create(['name' => 'Old Name']);

        $updated = $this->service->updateBrand($brand->id, ['name' => 'New Name']);

        $this->assertEquals('New Name', $updated->name);
        $this->assertDatabaseHas('brands', [
            'id' => $brand->id,
            'name' => 'New Name',
        ]);
    }

    public function test_can_delete_a_brand(): void
    {
        $brand = Brand::factory()->create();

        $result = $this->service->deleteBrand($brand->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('brands', ['id' => $brand->id]);
    }

    public function test_cannot_delete_brand_with_products(): void
    {
        $brand = Brand::factory()->create(['products_count' => 5]);

        $canDelete = $this->repository->canDelete($brand);

        $this->assertFalse($canDelete['can_delete']);
        $this->assertArrayHasKey('reason', $canDelete);
    }

    public function test_can_get_brand_statistics(): void
    {
        // âœ… ط§طµظ„ط§ط­: featured brands ط±ط§ active ع©ظ†غŒظ…
        Brand::factory()->count(5)->create([
            'is_active' => true,
            'is_featured' => false,
        ]);
        Brand::factory()->count(3)->create([
            'is_active' => false,
            'is_featured' => false,
        ]);
        Brand::factory()->count(2)->create([
            'is_active' => true, // âœ… ط§طµظ„ط§ط­: featured brands ظ‡ظ… active ظ‡ط³طھظ†ط¯
            'is_featured' => true,
        ]);

        $stats = $this->repository->getStats();

        $this->assertEquals(10, $stats['total']);
        $this->assertEquals(7, $stats['active']); // âœ… غµ + غ² featured
        $this->assertEquals(3, $stats['inactive']);
        $this->assertEquals(2, $stats['featured']);
    }

    public function test_can_get_unique_countries(): void
    {
        Brand::factory()->create(['country' => 'Iran']);
        Brand::factory()->create(['country' => 'USA']);
        Brand::factory()->create(['country' => 'Iran']);
        Brand::factory()->create(['country' => null]);

        $countries = $this->repository->getCountries();

        $this->assertCount(2, $countries);
        $this->assertContains('Iran', $countries->toArray());
        $this->assertContains('USA', $countries->toArray());
    }

    public function test_can_verify_a_brand(): void
    {
        $brand = Brand::factory()->create([
            'verified_at' => null,
            'verification_badge' => 'none',
        ]);

        $verified = $this->repository->verify($brand);

        $this->assertNotNull($verified->verified_at);
    }

    public function test_can_perform_bulk_activate(): void
    {
        $brands = Brand::factory()->count(3)->create(['is_active' => false]);
        $ids = $brands->pluck('id')->toArray();

        $count = $this->repository->bulkAction($ids, 'activate');

        $this->assertEquals(3, $count);
        $this->assertEquals(3, Brand::whereIn('id', $ids)->where('is_active', true)->count());
    }

    public function test_can_perform_bulk_deactivate(): void
    {
        $brands = Brand::factory()->count(3)->create(['is_active' => true]);
        $ids = $brands->pluck('id')->toArray();

        $count = $this->repository->bulkAction($ids, 'deactivate');

        $this->assertEquals(3, $count);
        $this->assertEquals(3, Brand::whereIn('id', $ids)->where('is_active', false)->count());
    }
}