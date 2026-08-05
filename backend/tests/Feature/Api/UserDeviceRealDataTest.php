<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * «دستگاه‌های من» (DevicesSection.tsx در داشبورد کاربر) قبلاً به دو دلیل
 * جدا کاملاً غیرقابل‌استفاده بود:
 *
 * ۱) GET /devices/brands از جدول‌های brands/phone_series می‌خواند — جدول‌هایی
 *    که هیچ seeder ای پرشان نمی‌کند؛ همیشه لیست خالی برمی‌گشت و ویزارد
 *    «افزودن دستگاه» هیچ برندی نشان نمی‌داد.
 * ۲) حتی اگر لیستی وجود داشت، user_devices.phone_model_id به جدول
 *    phone_models (هم خالی) وصل بود، نه device_models — همان جدولی که
 *    Product::deviceModels() واقعاً به آن وصل است. یعنی حتی با یک
 *    phone_models دستی‌پر‌شده، «دستگاه‌های من» هیچ‌وقت با محصولات واقعی
 *    مچ نمی‌شد.
 *
 * این تست کل مسیر واقعی را با داده‌ی واقعاً seed‌شده (device_brands/
 * device_series/device_models) از سر تا ته بررسی می‌کند.
 */
class UserDeviceRealDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_brands_endpoint_returns_real_seeded_brands(): void
    {
        $brand = DeviceBrand::factory()->create(['is_active' => true]);
        DeviceSeries::factory()->create(['brand_id' => $brand->id]);

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/devices/brands');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($brand->id));
    }

    public function test_full_add_device_flow_from_brand_to_model(): void
    {
        $brand = DeviceBrand::factory()->create(['is_active' => true]);
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        $model = DeviceModel::factory()->create(['series_id' => $series->id]);
        $user = User::factory()->create();

        // مرحله ۱: لیست برندها
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/devices/brands')
            ->assertOk()
            ->assertJsonFragment(['id' => $brand->id]);

        // مرحله ۲: لیست سری‌های همان برند
        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/devices/brands/{$brand->id}/series")
            ->assertOk()
            ->assertJsonFragment(['id' => $series->id]);

        // مرحله ۳: لیست مدل‌های همان سری
        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/devices/series/{$series->id}/models")
            ->assertOk()
            ->assertJsonFragment(['id' => $model->id]);

        // مرحله ۴: افزودن دستگاه — قبلاً اینجا exists:phone_models,id رد
        // می‌شد چون model->id در آن جدول خالی وجود نداشت.
        $addResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/user/devices', ['phone_model_id' => $model->id]);

        $addResponse->assertCreated();
        $this->assertDatabaseHas('user_devices', [
            'user_id' => $user->id,
            'phone_model_id' => $model->id,
        ]);

        // مرحله ۵: لیست دستگاه‌های کاربر باید نام برند را هم‌ردیف با سری نشان بدهد
        $listResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/user/devices');
        $listResponse->assertOk();
        $device = collect($listResponse->json('data'))->firstWhere('phone_model_id', $model->id);
        $this->assertNotNull($device);
        $this->assertEquals($brand->name, $device['phone_model']['brand']['name']);
        $this->assertEquals($series->name, $device['phone_model']['series']['name']);
    }

    public function test_registered_device_actually_matches_real_product_compatibility(): void
    {
        $brand = DeviceBrand::factory()->create(['is_active' => true]);
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        $model = DeviceModel::factory()->create(['series_id' => $series->id]);
        $user = User::factory()->create();

        $product = Product::factory()->create(['is_active' => true]);
        $product->deviceModels()->attach($model->id);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/user/devices', ['phone_model_id' => $model->id])
            ->assertCreated();

        // همان endpoint واقعی که ProductsPage برای فیلتر «دستگاه‌های من» صدا می‌زند
        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/products/compatible/{$model->id}");

        $response->assertOk();
        $ids = collect($response->json('data.data') ?? $response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($product->id), 'محصول واقعاً سازگار باید در نتیجه باشد.');
    }
}
