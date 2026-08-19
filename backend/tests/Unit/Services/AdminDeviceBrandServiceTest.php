<?php

namespace Tests\Unit\Services;

use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceSeries;
use App\Services\Admin\AdminDeviceBrandService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AdminDeviceBrandServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminDeviceBrandService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AdminDeviceBrandService::class);
    }

    public function test_can_get_brands_with_pagination()
    {
        DeviceBrand::factory()->count(5)->create();

        $result = $this->service->getBrands([], 10);

        $this->assertCount(5, $result['brands']);
        $this->assertEquals(1, $result['pagination']['current_page']);
    }

    // ✅ Device-First Architecture — حذف نهایی type: این تست قبلاً فیلتر
    // type را می‌سنجید؛ معادل family-first همان، فیلتر family_id است
    // (که از فاز ۱E/۱H در repository موجود بود، نه چیزی که این تغییر اضافه
    // کرده باشد).
    public function test_can_filter_brands_by_family()
    {
        $smartphoneFamily = DeviceFamily::where('slug', 'smartphone')->first();
        $laptopFamily = DeviceFamily::where('slug', 'laptop')->first();

        DeviceBrand::factory()->create(['family_id' => $smartphoneFamily->id, 'name' => 'Apple']);
        DeviceBrand::factory()->create(['family_id' => $laptopFamily->id, 'name' => 'Asus']);

        $result = $this->service->getBrands(['family_id' => $smartphoneFamily->id], 10);

        $this->assertCount(1, $result['brands']);
        $this->assertEquals('Apple', $result['brands'][0]['name']);
    }

    public function test_can_create_brand()
    {
        $family = DeviceFamily::where('slug', 'smartphone')->first();

        $data = [
            'name' => 'Test Brand',
            'family_id' => $family->id,
            'is_active' => true,
        ];

        $brand = $this->service->createBrand($data);

        $this->assertDatabaseHas('device_brands', [
            'name' => 'Test Brand',
            'family_id' => $family->id,
        ]);
        $this->assertEquals('test-brand', $brand->slug);
    }

    public function test_can_update_brand()
    {
        $laptopFamily = DeviceFamily::where('slug', 'laptop')->first();
        $tabletFamily = DeviceFamily::where('slug', 'tablet')->first();
        $brand = DeviceBrand::factory()->create(['family_id' => $laptopFamily->id]);

        $updated = $this->service->updateBrand($brand->id, [
            'name' => 'Updated Brand',
            'family_id' => $tabletFamily->id,
        ]);

        $this->assertEquals('Updated Brand', $updated->name);
        $this->assertEquals($tabletFamily->id, $updated->family_id);
    }

    public function test_can_delete_brand()
    {
        $brand = DeviceBrand::factory()->create();

        $result = $this->service->deleteBrand($brand->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('device_brands', ['id' => $brand->id]);
    }

    public function test_cannot_delete_brand_with_existing_series()
    {
        $brand = DeviceBrand::factory()->create();
        
        // ایجاد یک سری تستی برای این برند
        DeviceSeries::create([
            'brand_id' => $brand->id,
            'name' => 'Test Series',
            'slug' => 'test-series',
        ]);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('این برند دارای سری دستگاه است و قابل حذف نیست.');
        
        $this->service->deleteBrand($brand->id);
    }
}