<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز C1: GET /products?device_family_id=X —
 * فقط محصولاتی که حداقل یک مدل دستگاه از همان خانواده دارند.
 */
class ProductFilterByFamilyTest extends TestCase
{
    use RefreshDatabase;

    public function test_filters_products_by_device_family(): void
    {
        $familyA = DeviceFamily::create(['name' => 'FA', 'slug' => 'fa-'.uniqid(), 'is_active' => true]);
        $familyB = DeviceFamily::create(['name' => 'FB', 'slug' => 'fb-'.uniqid(), 'is_active' => true]);

        $brandA = DeviceBrand::factory()->create(['family_id' => $familyA->id]);
        $modelA = DeviceModel::factory()->create(['series_id' => DeviceSeries::factory()->create(['brand_id' => $brandA->id])]);

        $brandB = DeviceBrand::factory()->create(['family_id' => $familyB->id]);
        $modelB = DeviceModel::factory()->create(['series_id' => DeviceSeries::factory()->create(['brand_id' => $brandB->id])]);

        $productA = Product::factory()->create(['is_active' => true]);
        $productA->deviceModels()->attach($modelA->id);

        $productB = Product::factory()->create(['is_active' => true]);
        $productB->deviceModels()->attach($modelB->id);

        $response = $this->getJson("/api/v1/products?device_family_id={$familyA->id}");

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($productA->id));
        $this->assertFalse($ids->contains($productB->id));
    }

    public function test_without_family_filter_all_active_products_are_returned(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/products');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($product->id));
    }
}
