<?php

namespace Tests\Feature;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GET /devices/header-hierarchy — داده‌ی مدال انتخاب دستگاه در هدر.
 *
 * device_models سه ستون واقعی و پرشده دارد: slug، image و release_year.
 * این کنترلر فقط id و name هر مدل را برمی‌گرداند — یعنی مدال هدر برای هر
 * مدلی، فارغ از اینکه دیتابیس عکس واقعی دارد یا نه، یک آیکون عمومی نشان
 * می‌داد، و فیلد slug مدلِ انتخاب‌شده در فرانت‌اند همیشه undefined بود.
 */
class DeviceHeaderHierarchyTest extends TestCase
{
    use RefreshDatabase;

    public function test_response_includes_slug_image_and_release_year_for_each_model(): void
    {
        $brand = DeviceBrand::factory()->create(['is_active' => true]);
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        $model = DeviceModel::factory()->create([
            'series_id' => $series->id,
            'slug' => 'galaxy-s24-ultra',
            'image' => 'https://example.com/galaxy-s24-ultra.jpg',
            'release_year' => 2024,
        ]);

        $response = $this->getJson('/api/v1/devices/header-hierarchy')->assertOk();

        $brandPayload = collect($response->json('data'))->firstWhere('id', $brand->id);
        $this->assertNotNull($brandPayload);

        $modelPayload = collect($brandPayload['series'][0]['models'])->firstWhere('id', $model->id);

        $this->assertNotNull($modelPayload, 'مدل در پاسخ نبود.');
        $this->assertSame('galaxy-s24-ultra', $modelPayload['slug']);
        $this->assertSame('https://example.com/galaxy-s24-ultra.jpg', $modelPayload['image']);
        $this->assertSame(2024, $modelPayload['release_year']);
    }

    public function test_inactive_brands_are_excluded(): void
    {
        $brand = DeviceBrand::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/devices/header-hierarchy')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($brand->id));
    }
}
