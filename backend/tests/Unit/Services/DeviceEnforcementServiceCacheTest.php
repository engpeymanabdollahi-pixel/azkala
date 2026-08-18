<?php

namespace Tests\Unit\Services;

use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Services\DeviceEnforcementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ✅ Device-First Architecture فاز ۳: assertModelsSelectable() به‌ازای هر
 * فراخوانی، مدل/سری/برند و دسته‌بندی/family_ids را از نو کوئری می‌زد —
 * در BulkProductService::createProducts() این متد تا ۵۰۰ بار در یک درخواست
 * صدا زده می‌شود (اندازه‌گیری‌شده: ~۵ کوئری اضافه به‌ازای هر ردیف، حتی وقتی
 * همان مدل/دسته‌بندیِ ردیف قبلی تکرار شده بود). این تست ثابت می‌کند
 * فراخوانی دوم با همان model_id/category_id هیچ کوئری جدیدی نمی‌زند
 * (کشِ درون‌نمونه‌ای)، بدون تغییر رفتار/پیام خطاها.
 */
class DeviceEnforcementServiceCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_repeated_calls_with_the_same_model_and_category_hit_the_database_only_once(): void
    {
        $family = DeviceFamily::firstOrCreate(['slug' => 'smartphone'], ['name' => 'Smartphone', 'is_active' => true]);
        $brand = DeviceBrand::create(['name' => 'B', 'slug' => 'b-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);
        $category = Category::factory()->create();
        $category->deviceFamilies()->sync([$family->id]);

        $service = new DeviceEnforcementService;

        // فراخوانی اول: کش خالی است، باید حداقل یک کوئری بزند.
        $service->assertModelsSelectable([$model->id], $category->id);

        DB::flushQueryLog();
        DB::enableQueryLog();

        // فراخوانی دوم و سوم: همان model_id/category_id — باید کاملاً از کش بیاید.
        $service->assertModelsSelectable([$model->id], $category->id);
        $service->assertModelsSelectable([$model->id], $category->id);

        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertSame(0, $queries, "فراخوانی‌های تکراری با همان model/category نباید کوئری جدیدی بزنند؛ {$queries} کوئری زده شد.");
    }

    public function test_cache_does_not_change_the_mismatch_error_behavior(): void
    {
        $family = DeviceFamily::firstOrCreate(['slug' => 'smartphone'], ['name' => 'Smartphone', 'is_active' => true]);
        $otherFamily = DeviceFamily::firstOrCreate(['slug' => 'laptop'], ['name' => 'Laptop', 'is_active' => true]);
        $brand = DeviceBrand::create(['name' => 'B', 'slug' => 'b-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);
        $category = Category::factory()->create();
        $category->deviceFamilies()->sync([$otherFamily->id]); // خانواده‌ی متفاوت — باید رد شود

        $service = new DeviceEnforcementService;

        $this->expectException(\InvalidArgumentException::class);
        $service->assertModelsSelectable([$model->id], $category->id);
    }
}
