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

    public function test_brand_has_many_series_and_models()
    {
        $brand = DeviceBrand::factory()->create();
        
        $series1 = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        $series2 = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        
        $this->assertCount(2, $brand->fresh()->series);
    }

    public function test_finding_model_by_slug_hierarchy()
    {
        $brand = DeviceBrand::factory()->create([
            'name' => 'Samsung',
            'slug' => 'samsung'
        ]);
        
        $series = DeviceSeries::factory()->create([
            'brand_id' => $brand->id,
            'name' => 'Galaxy S',
            'slug' => 'galaxy-s'
        ]);
        
        $model = DeviceModel::factory()->create([
            'series_id' => $series->id,
            'name' => 'S24 Ultra',
            'slug' => 's24-ultra'
        ]);

        $foundModel = DeviceModel::where('slug', 's24-ultra')
            ->whereHas('series', function ($q) {
                $q->where('slug', 'galaxy-s')
                  ->whereHas('brand', function ($q) {
                      $q->where('slug', 'samsung');
                  });
            })
            ->first();

        $this->assertNotNull($foundModel);
        $this->assertEquals('s24-ultra', $foundModel->slug);
    }
}