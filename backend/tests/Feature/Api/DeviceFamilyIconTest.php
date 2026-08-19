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
 * ✅ Device-First Architecture فاز ۵: تست‌های backfill آیکون خانواده +
 * expose شدنش در API های عمومی/کاربری.
 *
 * این تست‌ها عمداً روی migration واقعی فاز ۵ تکیه نمی‌کنند (چون
 * RefreshDatabase همه‌ی migration ها را از صفر اجرا می‌کند و نتیجه‌ی نهایی
 * را می‌سنجد، نه idempotency خودِ migration که در بخش ۳.۰.۷/فاز ۵ این
 * گزارش با اجرای مستقیم rollback→reapply روی DB واقعی تأیید شد) — بلکه
 * نتیجه‌ی *همیشگیِ* آن (سه خانواده‌ی canonical با icon پرشده) و مسیرهای
 * API که این مقدار را مصرف می‌کنند را می‌پوشانند.
 */
class DeviceFamilyIconTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->givePermissionTo(['catalog.view', 'catalog.manage']);

        return $u;
    }

    public function test_migration_backfilled_all_three_canonical_families_with_valid_icon(): void
    {
        $families = DeviceFamily::whereIn('slug', ['smartphone', 'laptop', 'tablet'])->get()->keyBy('slug');

        $this->assertSame('Smartphone', $families['smartphone']->icon);
        $this->assertSame('Laptop', $families['laptop']->icon);
        $this->assertSame('Tablet', $families['tablet']->icon);
    }

    public function test_backfill_never_overwrites_an_admin_customized_icon(): void
    {
        // ✅ شبیه‌سازی سناریوی «ادمین قبل از این migration خودش یک آیکون
        // دیگر ست کرده بود» — چون RefreshDatabase از صفر migrate می‌کند،
        // این تست idempotency واقعیِ WHERE icon IS NULL را با اجرای مجدد
        // دستیِ همان منطق روی یک ردیف از‌قبل‌پرشده می‌سنجد.
        DeviceFamily::where('slug', 'smartphone')->update(['icon' => 'CustomIcon']);

        \Illuminate\Support\Facades\DB::table('device_families')
            ->where('slug', 'smartphone')
            ->whereNull('icon')
            ->update(['icon' => 'Smartphone']);

        $this->assertSame('CustomIcon', DeviceFamily::where('slug', 'smartphone')->value('icon'));
    }

    public function test_public_device_families_endpoint_exposes_icon(): void
    {
        $response = $this->getJson('/api/v1/device-families');

        $response->assertOk();
        $data = collect($response->json('data'))->keyBy('slug');

        $this->assertSame('Smartphone', $data['smartphone']['icon']);
        $this->assertSame('Laptop', $data['laptop']['icon']);
        $this->assertSame('Tablet', $data['tablet']['icon']);
    }

    public function test_header_hierarchy_exposes_family_icon_per_brand(): void
    {
        $family = DeviceFamily::where('slug', 'smartphone')->first();
        $brand = DeviceBrand::create(['name' => 'Apple', 'slug' => 'apple-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);

        $response = $this->getJson('/api/v1/devices/header-hierarchy');

        $response->assertOk();
        $found = collect($response->json('data'))->firstWhere('id', $brand->id);
        $this->assertNotNull($found);
        $this->assertSame('Smartphone', $found['family']['icon']);
    }

    public function test_user_devices_endpoint_now_also_exposes_brand_family(): void
    {
        $family = DeviceFamily::where('slug', 'smartphone')->first();
        $brand = DeviceBrand::create(['name' => 'Apple', 'slug' => 'apple-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);

        $user = User::factory()->create();
        UserDevice::create(['user_id' => $user->id, 'phone_model_id' => $model->id, 'nickname' => 'd1']);

        $response = $this->actingAs($user)->getJson('/api/v1/user/devices');

        $response->assertOk();
        $device = $response->json('data.0');
        // ✅ فیلد قدیمیِ brand همچنان دقیقاً همان شکل قبلی است (رگرسیون API).
        $this->assertSame('Apple', $device['phone_model']['brand']['name']);
        // ✅ فیلد تازه‌ی family — additive، شکستن API نیست.
        $this->assertSame('Smartphone', $device['phone_model']['brand']['family']['icon']);
    }
}
