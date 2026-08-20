<?php

namespace Tests\Unit\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\User;
use App\Services\Seller\BulkProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز D2: BulkProductService باید هر ردیفِ
 * وابسته به خانواده‌ی غیرفعال را رد کند — بدون شکستنِ کل batch (سایر
 * ردیف‌های معتبر همچنان ساخته می‌شوند) و با جزئیاتِ خطا در $failed[].
 * DeviceEnforcementService از قبل این چک را در create() (فرم تکی) و در
 * createProducts() (bulk) به‌طور مشترک اجرا می‌کند — این تست مسیر bulk را
 * که تا این فاز هیچ پوششی نداشت قفل می‌کند.
 */
class BulkProductDeviceEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private function makeRow(int $rowNumber, Category $category, Brand $brand, DeviceModel $model): array
    {
        return [
            'row' => $rowNumber,
            'data' => [
                'name' => 'Product '.$rowNumber.'-'.uniqid(),
                'sku' => 'SKU-'.$rowNumber.'-'.uniqid(),
                'category_slug' => $category->slug,
                'brand_slug' => $brand->slug,
                'price' => 10000,
                'compare_price' => null,
                'stock' => 5,
                'short_description' => '',
                'description' => '',
                'main_image_url' => '',
                'specifications_json' => '',
                'device_model_slug' => $model->slug,
            ],
        ];
    }

    public function test_row_with_inactive_family_device_model_fails_without_breaking_the_batch(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        // مدل معتبر (خانواده فعال)
        $activeFamily = DeviceFamily::create(['name' => 'Active', 'slug' => 'active-'.uniqid(), 'is_active' => true]);
        $activeDevBrand = DeviceBrand::create(['name' => 'AB', 'slug' => 'ab-'.uniqid(), 'family_id' => $activeFamily->id, 'is_active' => true]);
        $activeSeries = DeviceSeries::create(['brand_id' => $activeDevBrand->id, 'name' => 'AS', 'slug' => 'as-'.uniqid(), 'is_active' => true]);
        $activeModel = DeviceModel::create(['series_id' => $activeSeries->id, 'name' => 'AM', 'slug' => 'am-'.uniqid(), 'is_active' => true]);

        // مدل نامعتبر (خانواده غیرفعال)
        $inactiveFamily = DeviceFamily::create(['name' => 'Inactive', 'slug' => 'inactive-'.uniqid(), 'is_active' => false]);
        $inactiveDevBrand = DeviceBrand::create(['name' => 'IB', 'slug' => 'ib-'.uniqid(), 'family_id' => $inactiveFamily->id, 'is_active' => true]);
        $inactiveSeries = DeviceSeries::create(['brand_id' => $inactiveDevBrand->id, 'name' => 'IS', 'slug' => 'is-'.uniqid(), 'is_active' => true]);
        $inactiveModel = DeviceModel::create(['series_id' => $inactiveSeries->id, 'name' => 'IM', 'slug' => 'im-'.uniqid(), 'is_active' => true]);

        $rows = [
            $this->makeRow(2, $category, $brand, $activeModel),
            $this->makeRow(3, $category, $brand, $inactiveModel),
            $this->makeRow(4, $category, $brand, $activeModel),
        ];

        $service = app(BulkProductService::class);
        $result = $service->createProducts($rows, $seller->id);

        $this->assertCount(2, $result['created'], 'دو ردیفِ معتبر باید ساخته شوند — رد یک ردیف نباید batch را بشکند.');
        $this->assertCount(1, $result['failed'], 'ردیفِ متصل به خانواده‌ی غیرفعال باید رد شود.');
        $this->assertSame(3, $result['failed'][0]['row']);
        $this->assertStringContainsString('غیرفعال', $result['failed'][0]['error']);
    }
}
