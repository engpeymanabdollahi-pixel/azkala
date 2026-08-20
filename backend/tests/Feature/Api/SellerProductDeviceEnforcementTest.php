<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز D1: «Seller نمی‌تواند برای device غیرفعال
 * محصول بسازد». create() قبلاً توسط DeviceFirstArchitectureTest پوشش
 * داده شده بود (test_seller_is_blocked_from_attaching_inactive_family_
 * device_model) — این فایل مسیر update() را می‌سنجد، که همان
 * DeviceEnforcementService مشترک را صدا می‌زند ولی تا این فاز هیچ تست
 * اختصاصی نداشت.
 */
class SellerProductDeviceEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_cannot_attach_inactive_family_device_model_on_update(): void
    {
        $family = DeviceFamily::create(['name' => 'F', 'slug' => 'f-'.uniqid(), 'is_active' => false]);
        $brand = DeviceBrand::factory()->create(['family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id, 'is_active' => true]);
        $model = DeviceModel::factory()->create(['series_id' => $series->id, 'is_active' => true]);

        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        $response = $this->actingAs($seller)->putJson("/api/v1/seller/products/{$product->id}", [
            'device_model_ids' => [$model->id],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('device_model_product', [
            'product_id' => $product->id,
            'device_model_id' => $model->id,
        ]);
    }

    public function test_seller_can_attach_active_family_device_model_on_update(): void
    {
        $family = DeviceFamily::create(['name' => 'F2', 'slug' => 'f2-'.uniqid(), 'is_active' => true]);
        $brand = DeviceBrand::factory()->create(['family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id, 'is_active' => true]);
        $model = DeviceModel::factory()->create(['series_id' => $series->id, 'is_active' => true]);

        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        $response = $this->actingAs($seller)->putJson("/api/v1/seller/products/{$product->id}", [
            'device_model_ids' => [$model->id],
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('device_model_product', [
            'product_id' => $product->id,
            'device_model_id' => $model->id,
        ]);
    }
}
