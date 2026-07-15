<?php

namespace Tests\Unit\Models;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use App\Models\DeviceModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceHierarchyScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_brand_has_many_series_and_models(): void
    {
        $brand = DeviceBrand::create(['name' => 'Apple', 'slug' => 'apple']);
        $series1 = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'iPhone', 'slug' => 'iphone']);
        $series2 = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'iPad', 'slug' => 'ipad']);

        $model1 = DeviceModel::create(['series_id' => $series1->id, 'name' => 'iPhone 15', 'slug' => 'iphone-15']);
        $model2 = DeviceModel::create(['series_id' => $series1->id, 'name' => 'iPhone 14', 'slug' => 'iphone-14']);
        
        DeviceModel::create(['series_id' => $series2->id, 'name' => 'iPad Pro', 'slug' => 'ipad-pro']);

        $this->assertEquals(2, $brand->series->count());
        $this->assertEquals(2, $series1->models->count());
        $this->assertEquals(1, $series2->models->count());

        $brandModelIds = $brand->series->flatMap->models->pluck('id');
        $this->assertContains($model1->id, $brandModelIds);
        $this->assertContains($model2->id, $brandModelIds);
    }

    public function test_finding_model_by_slug_hierarchy(): void
    {
        $brand = DeviceBrand::create(['name' => 'Samsung', 'slug' => 'samsung']);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'A Series', 'slug' => 'a-series']);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'A55', 'slug' => 'a55']);

        $foundModel = DeviceModel::whereHas('series', function($q) use ($brand) {
            $q->where('brand_id', $brand->id);
        })->where('slug', 'a55')->first();

        $this->assertNotNull($foundModel);
        $this->assertEquals('Samsung', $foundModel->series->brand->name);
    }
}