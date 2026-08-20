<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز C4: GET /products/compatible/{modelId}
 * قبلاً همیشه current_page=1/last_page=1 ساختگی برمی‌گرداند بدون توجه به
 * تعداد واقعی نتایج. این تست صفحه‌بندی واقعی را قفل می‌کند.
 */
class CompatibleProductsPaginationTest extends TestCase
{
    use RefreshDatabase;

    private function makeModel(): DeviceModel
    {
        $brand = DeviceBrand::factory()->create();
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id]);

        return DeviceModel::factory()->create(['series_id' => $series->id]);
    }

    public function test_response_reflects_real_pagination(): void
    {
        $model = $this->makeModel();
        for ($i = 0; $i < 25; $i++) {
            $product = Product::factory()->create(['is_active' => true]);
            $product->deviceModels()->attach($model->id);
        }

        $response = $this->getJson("/api/v1/products/compatible/{$model->id}?per_page=10");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(10, $data['data']);
        $this->assertSame(1, $data['current_page']);
        $this->assertSame(3, $data['last_page']);
        $this->assertSame(10, $data['per_page']);
        $this->assertSame(25, $data['total']);
    }

    public function test_second_page_returns_remaining_items(): void
    {
        $model = $this->makeModel();
        for ($i = 0; $i < 15; $i++) {
            $product = Product::factory()->create(['is_active' => true]);
            $product->deviceModels()->attach($model->id);
        }

        $response = $this->getJson("/api/v1/products/compatible/{$model->id}?per_page=10&page=2");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(5, $data['data']);
        $this->assertSame(2, $data['current_page']);
    }

    public function test_empty_result_still_has_valid_pagination_shape(): void
    {
        $model = $this->makeModel();

        $response = $this->getJson("/api/v1/products/compatible/{$model->id}");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertSame(0, $data['total']);
        $this->assertSame(1, $data['current_page']);
        $this->assertCount(0, $data['data']);
    }
}
