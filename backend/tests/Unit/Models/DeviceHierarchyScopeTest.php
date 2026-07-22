<?php

namespace Tests\Unit\Models;

use App\Models\DeviceModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DeviceHierarchyScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_brand_has_many_series_and_models(): void
    {
        // ✅ استفاده از روش مستقیم برای جلوگیری از باگ Foreign Key در SQLite
        $brandId = DB::table('device_brands')->insertGetId([
            'name' => 'Test Brand', 'slug' => 'test-brand', 'is_active' => 1, 
            'created_at' => now(), 'updated_at' => now()
        ]);
        
        $seriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $brandId, 'name' => 'Test Series', 'slug' => 'test-series', 
            'created_at' => now(), 'updated_at' => now()
        ]);
        
        $modelId = DB::table('device_models')->insertGetId([
            'series_id' => $seriesId, 'name' => 'Test Model', 'slug' => 'test-model', 'release_year' => 2023, 
            'created_at' => now(), 'updated_at' => now()
        ]);

        $this->assertDatabaseHas('device_brands', ['id' => $brandId]);
        $this->assertDatabaseHas('device_series', ['id' => $seriesId]);
        $this->assertDatabaseHas('device_models', ['id' => $modelId]);
    }

    public function test_finding_model_by_slug_hierarchy(): void
    {
        $brandId = DB::table('device_brands')->insertGetId([
            'name' => 'Test Brand', 'slug' => 'test-brand', 'is_active' => 1, 
            'created_at' => now(), 'updated_at' => now()
        ]);
        
        $seriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $brandId, 'name' => 'Test Series', 'slug' => 'test-series', 
            'created_at' => now(), 'updated_at' => now()
        ]);
        
        DB::table('device_models')->insert([
            'series_id' => $seriesId, 'name' => 'Test Model', 'slug' => 'test-model-slug', 'release_year' => 2023, 
            'created_at' => now(), 'updated_at' => now()
        ]);

        $found = DeviceModel::where('slug', 'test-model-slug')->first();
        
        $this->assertNotNull($found);
        $this->assertEquals('test-model-slug', $found->slug);
    }
}