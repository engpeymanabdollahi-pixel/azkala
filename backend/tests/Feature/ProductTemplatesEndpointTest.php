<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceModel;
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
}
