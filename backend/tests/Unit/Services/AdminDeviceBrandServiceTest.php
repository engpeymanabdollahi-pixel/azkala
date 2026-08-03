<?php

namespace Tests\Unit\Services;

use App\Models\DeviceBrand;
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

    public function test_can_filter_brands_by_type()
    {
        DeviceBrand::factory()->create(['type' => 'mobile', 'name' => 'Apple']);
        DeviceBrand::factory()->create(['type' => 'laptop', 'name' => 'Asus']);

        $result = $this->service->getBrands(['type' => 'mobile'], 10);

        $this->assertCount(1, $result['brands']);
        $this->assertEquals('Apple', $result['brands'][0]['name']);
    }

    public function test_can_create_brand()
    {
        $data = [
            'name' => 'Test Brand',
            'type' => 'mobile',
            'is_active' => true,
        ];

        $brand = $this->service->createBrand($data);

        $this->assertDatabaseHas('device_brands', [
            'name' => 'Test Brand',
            'type' => 'mobile',
        ]);
        $this->assertEquals('test-brand', $brand->slug);
    }

    public function test_can_update_brand()
    {
        $brand = DeviceBrand::factory()->create(['type' => 'laptop']);

        $updated = $this->service->updateBrand($brand->id, [
            'name' => 'Updated Brand', 
            'type' => 'tablet'
        ]);

        $this->assertEquals('Updated Brand', $updated->name);
        $this->assertEquals('tablet', $updated->type);
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