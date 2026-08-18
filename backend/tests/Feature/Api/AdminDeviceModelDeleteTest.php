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
 * ✅ Device-First Architecture فاز ۳: AdminDeviceModelRepository::delete()
 * قبل از حذف مدل، وجود محصولِ متصل را با یک کوئری روی
 * `products.device_model_id` بررسی می‌کرد — ستونی که فاز ۱ حذف کرده بود
 * (device_model_product تنها منبع حقیقتِ سازگاری است). نتیجه: هر تلاش برای
 * حذف هر مدل دستگاهی از پنل ادمین، حتی مدلی بدون هیچ محصول متصلی، با خطای
 * SQL «no such column: device_model_id» به‌صورت ۵۰۰ شکست می‌خورد. هیچ تستی
 * این مسیر را پوشش نمی‌داد.
 */
class AdminDeviceModelDeleteTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->givePermissionTo(['catalog.view', 'catalog.manage']);

        return $u;
    }

    protected function makeModel(): DeviceModel
    {
        $brand = DeviceBrand::create(['name' => 'Test Brand', 'slug' => 'brand-'.uniqid(), 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'Test Series', 'slug' => 'series-'.uniqid(), 'is_active' => true]);

        return DeviceModel::create(['series_id' => $series->id, 'name' => 'Test Model', 'slug' => 'model-'.uniqid(), 'is_active' => true]);
    }

    public function test_admin_can_delete_a_device_model_with_no_linked_products(): void
    {
        $model = $this->makeModel();

        $response = $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-models/{$model->id}");

        $response->assertOk();
        $this->assertSoftDeleted('device_models', ['id' => $model->id]);
    }

    public function test_deleting_a_device_model_linked_to_a_product_is_blocked_not_a_500(): void
    {
        $model = $this->makeModel();
        $product = Product::factory()->create();
        $product->deviceModels()->attach($model->id);

        $response = $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-models/{$model->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('device_models', ['id' => $model->id, 'deleted_at' => null]);
    }
}
