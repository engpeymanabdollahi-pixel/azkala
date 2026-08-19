<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * GET /products/templates — کتابخانه‌ی محصولات آماده برای فروشندگان.
 *
 * فرانت‌اند «دستگاه‌های سازگار» هر تمپلیت را از همین پاسخ می‌خواند
 * (`template.device_models`)، ولی کنترلر رابطه‌ی deviceModels را eager-load
 * نمی‌کرد — یعنی این فیلد همیشه در پاسخ خالی بود، حتی برای تمپلیت‌هایی که در
 * دیتابیس واقعاً به چند مدل گوشی متصل بودند. هیچ تست موجودی هم این را
 * نمی‌گرفت چون خروجی JSON با/بدون آن رابطه فقط یک کلید غایب دارد، نه خطا.
 */
class ProductTemplatesEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function makeTemplate(array $deviceModelIds = []): Product
    {
        $template = Product::factory()->create([
            'seller_id' => null,
            'category_id' => Category::factory(),
            'brand_id' => Brand::factory(),
        ]);

        if ($deviceModelIds !== []) {
            $template->deviceModels()->sync($deviceModelIds);
        }

        return $template;
    }

    public function test_response_includes_the_compatible_device_models(): void
    {
        $device = DeviceModel::factory()->create(['name' => 'Galaxy S24 Ultra']);
        $template = $this->makeTemplate([$device->id]);

        $response = $this->getJson('/api/v1/products/templates');

        $response->assertOk();

        $payload = collect($response->json('data.data'))->firstWhere('id', $template->id);

        $this->assertNotNull($payload, 'تمپلیت در پاسخ نبود.');
        $this->assertArrayHasKey('device_models', $payload);
        $this->assertCount(1, $payload['device_models']);
        $this->assertSame('Galaxy S24 Ultra', $payload['device_models'][0]['name']);
    }

    public function test_query_count_does_not_grow_with_the_number_of_templates(): void
    {
        $device = DeviceModel::factory()->create();
        $this->makeTemplate([$device->id]);
        $this->makeTemplate([$device->id]);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/v1/products/templates')->assertOk();
        $few = count(DB::getQueryLog());
        DB::disableQueryLog();

        for ($i = 0; $i < 18; $i++) {
            $this->makeTemplate([$device->id]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/v1/products/templates')->assertOk();
        $many = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertSame($few, $many, 'تعداد کوئری با تعداد تمپلیت‌ها رشد می‌کند — یعنی جایی N+1 هست.');
    }

    public function test_a_product_with_a_seller_never_appears(): void
    {
        Product::factory()->create(['seller_id' => User::factory()->create()->id]);
        $template = $this->makeTemplate();

        $response = $this->getJson('/api/v1/products/templates')->assertOk();

        $ids = collect($response->json('data.data'))->pluck('id');
        $this->assertTrue($ids->contains($template->id));
        $this->assertCount(1, $ids);
    }

    /**
     * ?device_type=mobile|laptop|tablet — کتابخانه‌ی محصولات فقط دسته‌بندی‌های
     * لوازم جانبی دارد (قاب، شارژر، هدفون...)، نه خودِ دستگاه؛ تنها راه واقعی
     * برای «فقط لوازم گوشی» دیدن، فیلتر روی خانواده‌ی برندِ دستگاه‌های سازگارِ
     * هر تمپلیت است (device_models -> series -> device_brands -> family).
     *
     * ✅ Device-First Architecture — حذف نهایی device_brands.type: این تست
     * پیش‌تر دو نسخه‌ی جدا داشت («فیلتر type-based» و «فیلتر family-based
     * وقتی type=null») که از وقتی ستون type حذف شد، دقیقاً یک چیز را
     * می‌سنجیدند — اینجا ادغام شدند تا duplicate مصنوعی نباشد؛ همچنان دقیقاً
     * همان رفتار (شامل نگاشتِ مقدار legacy «mobile»→خانواده‌ی «smartphone»)
     * را می‌سنجد.
     */
    public function test_device_type_filter_keeps_only_templates_compatible_with_that_family(): void
    {
        $smartphoneFamily = DeviceFamily::firstOrCreate(['slug' => 'smartphone'], ['name' => 'Smartphone', 'is_active' => true]);
        $laptopFamily = DeviceFamily::firstOrCreate(['slug' => 'laptop'], ['name' => 'Laptop', 'is_active' => true]);

        $mobileBrand = DeviceBrand::factory()->create(['family_id' => $smartphoneFamily->id]);
        $mobileModel = DeviceModel::factory()->create(['series_id' => DeviceSeries::factory()->create(['brand_id' => $mobileBrand->id])]);

        $laptopBrand = DeviceBrand::factory()->create(['family_id' => $laptopFamily->id]);
        $laptopModel = DeviceModel::factory()->create(['series_id' => DeviceSeries::factory()->create(['brand_id' => $laptopBrand->id])]);

        $mobileTemplate = $this->makeTemplate([$mobileModel->id]);
        $laptopTemplate = $this->makeTemplate([$laptopModel->id]);

        $response = $this->getJson('/api/v1/products/templates?device_type=mobile')->assertOk();
        $ids = collect($response->json('data.data'))->pluck('id');

        $this->assertTrue($ids->contains($mobileTemplate->id));
        $this->assertFalse($ids->contains($laptopTemplate->id));
    }

    public function test_device_type_filter_is_ignored_when_value_is_not_a_known_device_type(): void
    {
        $smartphoneFamily = DeviceFamily::firstOrCreate(['slug' => 'smartphone'], ['name' => 'Smartphone', 'is_active' => true]);
        $mobileBrand = DeviceBrand::factory()->create(['family_id' => $smartphoneFamily->id]);
        $mobileModel = DeviceModel::factory()->create(['series_id' => DeviceSeries::factory()->create(['brand_id' => $mobileBrand->id])]);
        $template = $this->makeTemplate([$mobileModel->id]);

        // مقدار ناشناخته نباید کوئری را با یک where که هیچ‌وقت true نمی‌شود بشکند
        $response = $this->getJson('/api/v1/products/templates?device_type=not-a-real-type')->assertOk();
        $ids = collect($response->json('data.data'))->pluck('id');

        $this->assertTrue($ids->contains($template->id));
    }

    /**
     * ✅ فاز ۲: device_type دیگر به سه مقدار legacy (mobile/laptop/tablet)
     * محدود نیست — هر slug واقعیِ device_families را می‌پذیرد. یک خانواده‌ی
     * کاملاً جدید (Smartwatch، که هیچ نگاشت legacyِ ثابتی در کد ندارد) باید
     * بتواند از همین فیلتر عبور کند تا اثبات شود این endpoint دیگر به سه
     * مقدار هاردکد وابسته نیست.
     */
    public function test_device_type_filter_accepts_a_brand_new_family_slug_directly(): void
    {
        $watchFamily = DeviceFamily::create(['name' => 'Smartwatch', 'slug' => 'smartwatch', 'is_active' => true]);
        $watchBrand = DeviceBrand::factory()->create(['family_id' => $watchFamily->id]);
        $watchModel = DeviceModel::factory()->create(['series_id' => DeviceSeries::factory()->create(['brand_id' => $watchBrand->id])]);
        $watchTemplate = $this->makeTemplate([$watchModel->id]);

        $otherTemplate = $this->makeTemplate();

        $response = $this->getJson('/api/v1/products/templates?device_type=smartwatch')->assertOk();
        $ids = collect($response->json('data.data'))->pluck('id');

        $this->assertTrue($ids->contains($watchTemplate->id));
        $this->assertFalse($ids->contains($otherTemplate->id));
    }
}
