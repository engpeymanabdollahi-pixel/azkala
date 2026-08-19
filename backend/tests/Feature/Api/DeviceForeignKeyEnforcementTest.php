<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ✅ Phase 0.1 — Database Foreign-Key Test Integrity Audit.
 *
 * FACTUAL FINDING: phpunit.xml سراسری `DB_FOREIGN_KEYS=false` تنظیم کرده
 * (از همان commit اولیه‌ی «Major Architecture, Testing & Stability
 * Overhaul»، پیش از شروع این engagement — بدون توضیح مستند). یعنی
 * SQLiteConnector هرگز `PRAGMA foreign_keys = ON` صدا نمی‌زند و **هیچ FK
 * در کل ۱۱۵۰+ تستِ backend واقعاً enforce نمی‌شود** — نه CASCADE، نه SET
 * NULL، نه RESTRICT. یک INSERT با مقدار نامعتبر برای یک ستون FK هم بدون
 * خطا موفق می‌شود.
 *
 * چرا این فایل global phpunit.xml را عوض نمی‌کند: فلیپ کردن سراسریِ این
 * پرچم روی کل مجموعه (۱۱۵۰+ تست، خیلی فراتر از دامنه‌ی Device-First) ریسک
 * واقعی و اندازه‌گیری‌نشده دارد — هر seeder/factory/migration دیگری در کل
 * codebase که ترتیب درج را رعایت نکند می‌تواند شکست بخورد، و طبق قوانین
 * صریح این فاز («No broad refactor»، «Do NOT change database semantics
 * unless a confirmed defect requires it») این خارج از scope است. به‌جایش،
 * این فایل یک تراکنشِ enforcement واقعی و ایزوله می‌سازد: با
 * DatabaseMigrations (نه RefreshDatabase — چون RefreshDatabase یک اتصال
 * :memory: را بین همه‌ی تست‌های مجموعه به‌اشتراک می‌گذارد و هر تست را
 * داخل یک تراکنش می‌پیچد؛ SQLite با یک قانون مستند «PRAGMA foreign_keys
 * داخل یک تراکنش باز بی‌اثر است» این کار را برای RefreshDatabase غیرممکن
 * می‌کند) + یک purge/reconnect دستی *قبل* از parent::setUp()، یک اتصال
 * SQLite تازه و مستقل با foreign_key_constraints=true می‌سازد — فقط برای
 * تست‌های همین فایل، بدون لمس کردن هیچ تست دیگری در کل مجموعه.
 */
class DeviceForeignKeyEnforcementTest extends TestCase
{
    use DatabaseMigrations;

    /**
     * ✅ DatabaseMigrations::runDatabaseMigrations() این hook را بعد از
     * بالا آمدن application (پس Facade root موجود است) ولی قبل از اجرای
     * migrate:fresh صدا می‌زند — دقیقاً همان لحظه‌ی درست برای عوض کردن
     * config اتصال پیش از باز شدنِ واقعیِ connection.
     */
    protected function beforeRefreshingDatabase(): void
    {
        Config::set('database.connections.sqlite.foreign_key_constraints', true);
        DB::purge('sqlite');
    }

    /**
     * ✅ Phase 0.1 finding: trait اصلی DatabaseMigrations در تیرداون هر تست
     * یک `migrate:rollback` کامل ثبت می‌کند که down() تمام migrationهای کل
     * تاریخچه (نه فقط device-first) را اجرا می‌کند. این کار یک باگ
     * pre-existing و کاملاً بی‌ربط را آشکار کرد (مثلاً
     * add_referral_code_to_users_table::down() هم دقیقاً همان الگوی خرابِ
     * «index بدون drop قبل از drop column» را دارد) — نه چیزی که این فاز
     * قرار بود درباره‌اش باشد، و رفعِ همه‌ی این الگو در کل migration history
     * یک refactor گسترده و کاملاً خارج از scope است («No broad refactor»).
     * برای همین این تست فقط migrate:fresh را نگه می‌دارد (که با
     * Schema::dropAllTables خام کار می‌کند، نه down())، و رجیستر کردن
     * migrate:rollback در teardown را حذف می‌کند — رفتار FK enforcement که
     * این فایل می‌سنجد کاملاً دست‌نخورده می‌ماند.
     */
    public function runDatabaseMigrations()
    {
        $this->beforeRefreshingDatabase();
        $this->artisan('migrate:fresh', $this->migrateFreshUsing());
        $this->app[Kernel::class]->setArtisan(null);
        $this->afterRefreshingDatabase();
    }

    protected function setUp(): void
    {
        parent::setUp();

        // ✅ اثبات مستقیم: اگر pragma واقعاً روشن نشده باشد، بقیه‌ی این
        // تست‌ها بی‌معنی می‌شوند و باید همین‌جا فوراً معلوم شود، نه با یک
        // fail گیج‌کننده در وسط یک تست دیگر.
        $this->assertSame(
            1,
            (int) DB::selectOne('PRAGMA foreign_keys')->foreign_keys,
            'PRAGMA foreign_keys روشن نشد — این تست نمی‌تواند رفتار واقعیِ FK را بسنجد.'
        );
    }

    protected function makeChain(): array
    {
        $family = DeviceFamily::create(['name' => 'F', 'slug' => 'f-'.uniqid(), 'is_active' => true]);
        $brand = DeviceBrand::create(['name' => 'B', 'slug' => 'b-'.uniqid(), 'family_id' => $family->id, 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);

        return compact('family', 'brand', 'series', 'model');
    }

    // ==================== CASCADE ====================

    public function test_force_deleting_a_device_model_cascades_the_pivot_row_only_never_the_product(): void
    {
        ['model' => $model] = $this->makeChain();
        $product = Product::factory()->create();
        $product->deviceModels()->attach($model->id);

        $model->forceDelete();

        // پیوت CASCADE واقعاً پاک شده
        $this->assertDatabaseMissing('device_model_product', ['device_model_id' => $model->id]);
        // محصول دست‌نخورده مانده — نه soft-deleted، نه حذف‌شده
        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    public function test_force_deleting_a_device_model_never_touches_orders_reviews_or_wishlist(): void
    {
        ['model' => $model] = $this->makeChain();
        $product = Product::factory()->create();
        $product->deviceModels()->attach($model->id);

        $user = User::factory()->create();
        $order = DB::table('orders')->insertGetId([
            'user_id' => $user->id,
            'order_number' => 'ORD-'.uniqid(),
            'status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => 1000,
            'tax' => 0,
            'shipping' => 0,
            'discount' => 0,
            'total' => 1000,
            'shipping_address' => json_encode(['city' => 'test']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $orderItemId = DB::table('order_items')->insertGetId([
            'order_id' => $order,
            'product_id' => $product->id,
            'seller_id' => $user->id,
            'quantity' => 1,
            'price' => 1000,
            'total' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $reviewId = DB::table('reviews')->insertGetId([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'rating' => 5,
            'comment' => 'test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $wishlistId = DB::table('wishlists')->insertGetId([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $model->forceDelete();

        $this->assertDatabaseHas('orders', ['id' => $order]);
        $this->assertDatabaseHas('order_items', ['id' => $orderItemId]);
        $this->assertDatabaseHas('reviews', ['id' => $reviewId]);
        $this->assertDatabaseHas('wishlists', ['id' => $wishlistId]);
    }

    public function test_force_deleting_a_device_model_cascades_and_deletes_user_devices(): void
    {
        ['model' => $model] = $this->makeChain();
        $user = User::factory()->create();
        $userDevice = UserDevice::create(['user_id' => $user->id, 'phone_model_id' => $model->id, 'nickname' => 'my phone']);

        $model->forceDelete();

        // ⚠️ مستندسازی رسمی CASCADE واقعی — طبق فاز قبلی، این مسیر امروز از
        // هیچ کنترلر/سرویسی در اپ قابل‌دسترس نیست (forceDelete هرگز صدا زده
        // نمی‌شود)، ولی خودِ FK این رفتار مخرب را دارد.
        $this->assertDatabaseMissing('user_devices', ['id' => $userDevice->id]);
    }

    // ==================== SET NULL ====================

    public function test_force_deleting_a_device_model_sets_cart_item_device_model_id_to_null(): void
    {
        ['model' => $model] = $this->makeChain();
        $product = Product::factory()->create();
        $user = User::factory()->create();
        $cart = Cart::create(['user_id' => $user->id]);
        $cartItem = CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 1, 'price' => 1000, 'device_model_id' => $model->id]);

        $model->forceDelete();

        $this->assertDatabaseHas('cart_items', ['id' => $cartItem->id, 'device_model_id' => null]);
    }

    public function test_deleting_a_device_family_sets_brand_family_id_to_null(): void
    {
        ['family' => $family, 'brand' => $brand] = $this->makeChain();

        // برند را از سری/مدل جدا می‌کنیم تا family قابل حذف باشد (بدون اتکا
        // به guard سطح اپ — این تست مستقیماً DB را می‌سنجد)
        DB::table('device_series')->where('brand_id', $brand->id)->delete();
        $family->forceDelete();

        $this->assertDatabaseHas('device_brands', ['id' => $brand->id, 'family_id' => null]);
    }

    // ==================== RESTRICT (سطح اپلیکیشن، نه DB) ====================

    /**
     * ✅ هیچ‌کدام از FKهای این زنجیره در سطح DB واقعاً RESTRICT/NO ACTION
     * ندارند (همه یا CASCADE‌اند یا SET NULL) — «رد کردن حذف در صورت وجود
     * وابستگی» فقط در Repository لایه (guard صریح) پیاده شده، نه در schema.
     * این تست همان چیزی را که در فاز قبلی از طریق API تأیید شده بود این‌بار
     * مستقیماً روی DB با FK واقعاً روشن، دوباره تأیید می‌کند تا اطمینان
     * حاصل شود روشن‌بودنِ FK رفتار guardهای اپلیکیشن را نمی‌شکند.
     */
    public function test_app_level_guard_still_blocks_deletion_with_real_fk_enforcement_on(): void
    {
        ['brand' => $brand] = $this->makeChain();
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->givePermissionTo(['catalog.view', 'catalog.manage']);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/device-brands/{$brand->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('device_brands', ['id' => $brand->id, 'deleted_at' => null]);
    }
}
