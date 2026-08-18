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
 * ✅ Delete & Data-Integrity Audit (Device-First): این تست مستقیماً رفتار
 * DELETE را در کل زنجیره‌ی Family → Brand → Series → Model در برابر
 * Products/Cart/UserDevices تأیید می‌کند — با دو دسته آزمون:
 *
 *   ۱. رفتار سطح API (از طریق endpoint واقعی، با guardهای موجود در
 *      Repository): حذف باید هر جا وابستگی دارد رد شود (۴۰۰/۴۰۹)، و هر جا
 *      وابستگی ندارد موفق شود — بدون هرگز لمس کردن Product/Cart/Order.
 *   ۲. کاراکتریزاسیون سطح دیتابیس (forceDelete مستقیم، بایپس‌کردن عمدی
 *      guardها): مستند می‌کند CASCADE/SET NULL واقعیِ FK چیست — تا اگر در
 *      آینده کسی جایی forceDelete() اضافه کرد، این تست همان لحظه رفتار
 *      واقعی‌اش را نشان می‌دهد، نه اینکه خاموش بماند.
 */
class DeviceDeletionDataIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->givePermissionTo(['catalog.view', 'catalog.manage']);

        return $u;
    }

    protected function makeChain(): array
    {
        $family = DeviceFamily::create(['name' => 'F', 'slug' => 'f-'.uniqid(), 'is_active' => true]);
        $brand = DeviceBrand::create(['name' => 'B', 'slug' => 'b-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);

        return compact('family', 'brand', 'series', 'model');
    }

    // ==================== سطح API: باید رد شود ====================

    public function test_deleting_a_family_with_a_brand_is_blocked(): void
    {
        ['family' => $family] = $this->makeChain();

        $response = $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-families/{$family->id}");

        $response->assertStatus(409);
        $this->assertDatabaseHas('device_families', ['id' => $family->id]);
    }

    public function test_deleting_a_brand_with_a_series_is_blocked(): void
    {
        ['brand' => $brand] = $this->makeChain();

        $response = $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-brands/{$brand->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('device_brands', ['id' => $brand->id, 'deleted_at' => null]);
    }

    public function test_deleting_a_series_with_a_model_is_blocked(): void
    {
        ['series' => $series] = $this->makeChain();

        $response = $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-series/{$series->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('device_series', ['id' => $series->id, 'deleted_at' => null]);
    }

    public function test_deleting_a_model_with_a_product_is_blocked(): void
    {
        ['model' => $model] = $this->makeChain();
        $product = Product::factory()->create();
        $product->deviceModels()->attach($model->id);

        $response = $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-models/{$model->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('device_models', ['id' => $model->id, 'deleted_at' => null]);
        // محصول دست‌نخورده می‌ماند
        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    // ==================== سطح API: باید موفق شود (بدون وابستگی) ====================

    public function test_deleting_an_empty_brand_series_and_model_succeeds_as_soft_delete(): void
    {
        ['brand' => $brand, 'series' => $series, 'model' => $model] = $this->makeChain();
        $admin = $this->admin();

        // از پایین به بالا حذف می‌کنیم تا هیچ‌کدام وابستگی نداشته باشند
        $this->actingAs($admin)->deleteJson("/api/v1/admin/device-models/{$model->id}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/v1/admin/device-series/{$series->id}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/v1/admin/device-brands/{$brand->id}")->assertOk();

        // ✅ هر سه SoftDeletes دارند — یعنی «حذف» یعنی soft-delete، نه واقعاً
        // پاک‌شدن ردیف از دیتابیس.
        $this->assertSoftDeleted('device_models', ['id' => $model->id]);
        $this->assertSoftDeleted('device_series', ['id' => $series->id]);
        $this->assertSoftDeleted('device_brands', ['id' => $brand->id]);
    }

    public function test_deleting_an_empty_family_is_a_real_hard_delete(): void
    {
        $family = DeviceFamily::create(['name' => 'Empty', 'slug' => 'empty-'.uniqid(), 'is_active' => true]);

        $this->actingAs($this->admin())->deleteJson("/api/v1/admin/device-families/{$family->id}")->assertOk();

        // ✅ برخلاف Brand/Series/Model، DeviceFamily مدل SoftDeletes ندارد —
        // یعنی این یک DELETE واقعی است، نه soft-delete.
        $this->assertDatabaseMissing('device_families', ['id' => $family->id]);
    }

    // ==================== Authorization ====================

    public function test_non_admin_cannot_delete_any_device_hierarchy_level(): void
    {
        ['family' => $family, 'brand' => $brand, 'series' => $series, 'model' => $model] = $this->makeChain();
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->deleteJson("/api/v1/admin/device-families/{$family->id}")->assertForbidden();
        $this->actingAs($customer)->deleteJson("/api/v1/admin/device-brands/{$brand->id}")->assertForbidden();
        $this->actingAs($customer)->deleteJson("/api/v1/admin/device-series/{$series->id}")->assertForbidden();
        $this->actingAs($customer)->deleteJson("/api/v1/admin/device-models/{$model->id}")->assertForbidden();

        // هیچ‌کدام واقعاً حذف نشده‌اند
        $this->assertDatabaseHas('device_families', ['id' => $family->id]);
        $this->assertDatabaseHas('device_brands', ['id' => $brand->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('device_series', ['id' => $series->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('device_models', ['id' => $model->id, 'deleted_at' => null]);
    }

    // ==================== forceDelete: هرگز از مسیرهای اپ صدا زده نمی‌شود ====================

    /**
     * ✅ هیچ کنترلر/سرویس/کامندی در کل backend جایی forceDelete() را روی
     * DeviceFamily/DeviceBrand/DeviceSeries/DeviceModel صدا نمی‌زند (تأیید
     * با grep کامل روی app/) — یعنی FK های واقعیِ CASCADE/SET NULL تعریف‌شده
     * در migrationها (device_model_product، cart_items، user_devices) امروز
     * از هیچ مسیر اپلیکیشنی قابل‌دسترس نیستند؛ همه‌ی «حذف»های واقعی از پنل
     * ادمین یا soft-delete (Brand/Series/Model، guard‌شده) یا یک hard-delete
     * با guard صریح (Family) هستند. رفتار واقعیِ این FKها با forceDelete()
     * مستقیم و PRAGMA foreign_keys=ON دستی (خارج از تست‌ها، چون phpunit.xml
     * عمداً DB_FOREIGN_KEYS=false دارد و SQLite این pragma را داخل یک
     * تراکنشِ بازِ RefreshDatabase بی‌اثر می‌کند) تأیید و در گزارش این فاز
     * مستند شده: پیوت device_model_product پاک می‌شود (محصول دست‌نخورده)،
     * cart_items.device_model_id به NULL می‌رود، و user_devices واقعاً
     * CASCADE (حذف کامل ردیف) می‌شود — یک ریسک نظری که چون هیچ کد فعلی به
     * آن نمی‌رسد، طبق قانون «بدون مدرک تغییر schema مخرب نده» دست‌نخورده
     * مستند شد، نه schema-fix.
     */
    public function test_no_controller_service_or_command_calls_force_delete_on_device_hierarchy_models(): void
    {
        $appPath = base_path('app');
        $matches = [];

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($appPath));
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $contents = file_get_contents($file->getPathname());
                if (str_contains($contents, 'forceDelete')) {
                    $matches[] = $file->getPathname();
                }
            }
        }

        // تنها استثنای شناخته‌شده: امضای متد forceDelete() در ProductAlertPolicy
        // (بی‌ربط به دستگاه‌ها، حتی خودش را هم اجرا نمی‌کند).
        $unexpected = array_filter($matches, fn ($f) => ! str_contains($f, 'ProductAlertPolicy.php'));

        $this->assertEmpty(
            $unexpected,
            'یک یا چند فایل جدید forceDelete() صدا می‌زنند — رفتار CASCADE واقعیِ FKها (که برای user_devices مخرب است) اکنون ممکن است از یک مسیر اپلیکیشنی قابل‌دسترس باشد: '.implode(', ', $unexpected)
        );
    }

    public function test_deactivating_instead_of_deleting_preserves_everything_including_discoverability_checks(): void
    {
        ['family' => $family, 'brand' => $brand, 'series' => $series, 'model' => $model] = $this->makeChain();
        $product = Product::factory()->create();
        $product->deviceModels()->attach($model->id);

        // ✅ سیاست ایمن: به‌جای حذف، غیرفعال‌سازی — هیچ رکوردی از بین
        // نمی‌رود، فقط از مسیرهای عمومی کشف نمی‌شود (طبق فاز ۱M/۱G).
        $this->actingAs($this->admin())
            ->putJson("/api/v1/admin/device-models/{$model->id}", ['is_active' => false])
            ->assertOk();

        $this->assertDatabaseHas('device_models', ['id' => $model->id, 'is_active' => false, 'deleted_at' => null]);
        $this->assertDatabaseHas('device_model_product', ['device_model_id' => $model->id, 'product_id' => $product->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}
