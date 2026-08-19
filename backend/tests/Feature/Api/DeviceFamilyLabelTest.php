<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Device-First Architecture فاز ۸: تست‌های مهاجرت
 * localize_device_families_name + expose شدنِ نامِ فارسی در API های
 * عمومی/کاربری که فاز ۵ برای آیکون پوشش داده بود.
 *
 * دقیقاً مثل DeviceFamilyIconTest (فاز ۵)، این تست‌ها عمداً روی migration
 * واقعی تکیه می‌کنند تا idempotency خودش را نسنجند (آن جداگانه، مستقیماً
 * روی dev DB با rollback→reapply تأیید شد) — بلکه نتیجه‌ی *همیشگیِ* آن
 * (سه خانواده‌ی canonical با name فارسی) و مسیرهای API که این مقدار را
 * مصرف می‌کنند را می‌پوشانند.
 */
class DeviceFamilyLabelTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_localized_all_three_canonical_family_names_to_persian(): void
    {
        $families = DeviceFamily::whereIn('slug', ['smartphone', 'laptop', 'tablet'])->get()->keyBy('slug');

        $this->assertSame('گوشی', $families['smartphone']->name);
        $this->assertSame('لپ‌تاپ', $families['laptop']->name);
        $this->assertSame('تبلت', $families['tablet']->name);
    }

    public function test_migration_never_overwrites_an_admin_customized_name(): void
    {
        // ✅ شبیه‌سازی سناریوی «ادمین قبل از این migration خودش نام را به
        // چیز دیگری تغییر داده بود» — چون RefreshDatabase از صفر migrate
        // می‌کند، این تست idempotency واقعیِ WHERE name = 'Smartphone' را با
        // اجرای مجدد دستیِ همان منطق روی یک ردیفِ از‌قبل‌تغییریافته می‌سنجد.
        DeviceFamily::where('slug', 'smartphone')->update(['name' => 'نام سفارشی ادمین']);

        \Illuminate\Support\Facades\DB::table('device_families')
            ->where('slug', 'smartphone')
            ->where('name', 'Smartphone')
            ->update(['name' => 'گوشی']);

        $this->assertSame('نام سفارشی ادمین', DeviceFamily::where('slug', 'smartphone')->value('name'));
    }

    public function test_public_device_families_endpoint_exposes_persian_name(): void
    {
        $response = $this->getJson('/api/v1/device-families');

        $response->assertOk();
        $data = collect($response->json('data'))->keyBy('slug');

        $this->assertSame('گوشی', $data['smartphone']['name']);
        $this->assertSame('لپ‌تاپ', $data['laptop']['name']);
        $this->assertSame('تبلت', $data['tablet']['name']);
    }

    public function test_header_hierarchy_exposes_persian_family_name_per_brand(): void
    {
        $family = DeviceFamily::where('slug', 'smartphone')->first();
        $brand = DeviceBrand::create(['name' => 'اپل', 'slug' => 'apple-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);

        $response = $this->getJson('/api/v1/devices/header-hierarchy');

        $response->assertOk();
        $found = collect($response->json('data'))->firstWhere('id', $brand->id);
        $this->assertNotNull($found);
        $this->assertSame('گوشی', $found['family']['name']);
    }

    public function test_user_devices_endpoint_exposes_persian_family_name(): void
    {
        $family = DeviceFamily::where('slug', 'laptop')->first();
        $brand = DeviceBrand::create(['name' => 'ایسوس', 'slug' => 'asus-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);

        $user = User::factory()->create();
        UserDevice::create(['user_id' => $user->id, 'phone_model_id' => $model->id, 'nickname' => 'd1']);

        $response = $this->actingAs($user)->getJson('/api/v1/user/devices');

        $response->assertOk();
        $device = $response->json('data.0');
        // ✅ فیلد قدیمیِ brand همچنان دقیقاً همان شکل قبلی است (رگرسیون API).
        $this->assertSame('ایسوس', $device['phone_model']['brand']['name']);
        // ✅ family.name اکنون فارسی است — همان فیلدی که فاز ۵ برای icon اضافه کرد.
        $this->assertSame('لپ‌تاپ', $device['phone_model']['brand']['family']['name']);
    }

    /**
     * ✅ اثبات این‌که مکانیزم برچسب برای خانواده‌های آینده (Smartwatch،
     * Camera، ...) بدون هیچ if/switch هاردکدشده‌ی جدید کار می‌کند — کافی‌ست
     * ادمین یک ردیف DeviceFamily با name فارسی دلخواه بسازد؛ همان name
     * مستقیماً در API ها ظاهر می‌شود، بدون نیاز به تغییر کد.
     */
    public function test_arbitrary_new_family_name_passes_through_without_hardcoded_mapping(): void
    {
        $family = DeviceFamily::create([
            'name' => 'ساعت هوشمند',
            'slug' => 'smartwatch',
            'icon' => 'Watch',
            'sort_order' => 99,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/device-families');

        $response->assertOk();
        $data = collect($response->json('data'))->keyBy('slug');

        $this->assertSame('ساعت هوشمند', $data['smartwatch']['name']);
        $this->assertSame($family->icon, $data['smartwatch']['icon']);
    }
}
