<?php

namespace Tests\Unit\Models;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use App\Models\DeviceModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceModelScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_scope_latest_models_returns_recent_releases(): void
    {
        $brand = DeviceBrand::create(['name' => 'Samsung', 'slug' => 'samsung']);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S Series', 'slug' => 's-series']);

        DeviceModel::create(['series_id' => $series->id, 'name' => 'S22', 'slug' => 's22', 'release_year' => 2022]);
        DeviceModel::create(['series_id' => $series->id, 'name' => 'S23', 'slug' => 's23', 'release_year' => 2023]);
        DeviceModel::create(['series_id' => $series->id, 'name' => 'S24', 'slug' => 's24', 'release_year' => 2024]);

        $latestModels = DeviceModel::ofBrand('samsung')->latestModels(2)->get();

        $this->assertCount(2, $latestModels);
        $this->assertEquals('S24', $latestModels->first()->name);
        $this->assertEquals('S23', $latestModels->last()->name);
    }

    public function test_scope_search_by_name_fuzzy_match(): void
    {
        $brand = DeviceBrand::create(['name' => 'Apple', 'slug' => 'apple']);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'iPhone', 'slug' => 'iphone']);

        DeviceModel::create(['series_id' => $series->id, 'name' => 'iPhone 15 Pro Max', 'slug' => 'iphone-15-pro-max', 'release_year' => 2023]);
        DeviceModel::create(['series_id' => $series->id, 'name' => 'iPhone 14', 'slug' => 'iphone-14', 'release_year' => 2022]);

        $results = DeviceModel::search('15 pro')->get();

        $this->assertCount(1, $results);
        $this->assertEquals('iPhone 15 Pro Max', $results->first()->name);
    }
}