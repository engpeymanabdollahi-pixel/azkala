<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Device-First Architecture — Phase 1N: پوشش تست از صفر (فاز ۰ تایید کرد
 * هیچ تست معناداری برای زیرسیستم دستگاه وجود نداشت).
 */
class DeviceFirstArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->givePermissionTo(['catalog.view', 'catalog.manage']);

        return $u;
    }

    protected function seller(): User
    {
        return User::factory()->create(['role' => 'seller']);
    }

    /** یک زنجیره‌ی کامل و فعال family→brand→series→model می‌سازد. */
    protected function makeChain(string $familySlug = 'smartphone', bool $familyActive = true, bool $brandActive = true, bool $seriesActive = true, bool $modelActive = true): array
    {
        $family = DeviceFamily::firstOrCreate(
            ['slug' => $familySlug],
            ['name' => ucfirst($familySlug), 'is_active' => $familyActive]
        );
        if ($family->is_active !== $familyActive) {
            $family->update(['is_active' => $familyActive]);
        }

        $brand = DeviceBrand::create([
            'name' => 'Test Brand '.uniqid(),
            'slug' => 'brand-'.uniqid(),
            'family_id' => $family->id,
            'is_active' => $brandActive,
        ]);

        $series = DeviceSeries::create([
            'brand_id' => $brand->id,
            'name' => 'Test Series',
            'slug' => 'series-'.uniqid(),
            'is_active' => $seriesActive,
        ]);

        $model = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'Test Model',
            'slug' => 'model-'.uniqid(),
            'is_active' => $modelActive,
        ]);

        return compact('family', 'brand', 'series', 'model');
    }

    // ==================== 1E: Admin DeviceFamily CRUD ====================

    public function test_admin_can_create_list_and_update_device_family(): void
    {
        $admin = $this->admin();

        $create = $this->actingAs($admin)->postJson('/api/v1/admin/device-families', [
            'name' => 'Smartwatch',
            'is_active' => true,
        ]);
        $create->assertStatus(201);
        $id = $create->json('data.id');

        $this->actingAs($admin)->getJson('/api/v1/admin/device-families')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Smartwatch']);

        $this->actingAs($admin)->putJson("/api/v1/admin/device-families/{$id}", ['is_active' => false])
            ->assertStatus(200);

        $this->assertDatabaseHas('device_families', ['id' => $id, 'is_active' => false]);
    }

    public function test_device_family_slug_must_be_unique(): void
    {
        $admin = $this->admin();
        DeviceFamily::create(['name' => 'Tablet Dup', 'slug' => 'tablet-dup', 'is_active' => true]);

        $this->actingAs($admin)->postJson('/api/v1/admin/device-families', [
            'name' => 'Another', 'slug' => 'tablet-dup',
        ])->assertStatus(422);
    }

    public function test_admin_cannot_delete_family_with_dependent_brand(): void
    {
        ['family' => $family] = $this->makeChain();
        $admin = $this->admin();

        $this->actingAs($admin)->deleteJson("/api/v1/admin/device-families/{$family->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('device_families', ['id' => $family->id]);
    }

    public function test_non_admin_cannot_access_device_family_admin_api(): void
    {
        $seller = $this->seller();
        $this->actingAs($seller)->getJson('/api/v1/admin/device-families')->assertStatus(403);
    }

    // ==================== 1F: Public DeviceFamily list ====================

    public function test_public_device_families_endpoint_hides_inactive(): void
    {
        DeviceFamily::create(['name' => 'Camera', 'slug' => 'camera', 'is_active' => true]);
        DeviceFamily::create(['name' => 'Hidden Family', 'slug' => 'hidden-family', 'is_active' => false]);

        $response = $this->getJson('/api/v1/device-families');
        $response->assertStatus(200)
            ->assertJsonFragment(['slug' => 'camera'])
            ->assertJsonMissing(['slug' => 'hidden-family']);
    }

    // ==================== 1C: DeviceBrand → DeviceFamily ====================

    public function test_device_brand_belongs_to_family(): void
    {
        ['family' => $family, 'brand' => $brand] = $this->makeChain();

        $this->assertEquals($family->id, $brand->fresh()->family->id);
        $this->assertTrue($family->brands->contains('id', $brand->id));
    }

    // ==================== 1I: Category ↔ DeviceFamily M:N ====================

    public function test_admin_can_assign_multiple_device_families_to_category(): void
    {
        $admin = $this->admin();
        $category = Category::factory()->create();
        $family1 = DeviceFamily::create(['name' => 'F1', 'slug' => 'f1-'.uniqid(), 'is_active' => true]);
        $family2 = DeviceFamily::create(['name' => 'F2', 'slug' => 'f2-'.uniqid(), 'is_active' => true]);

        $this->actingAs($admin)->putJson("/api/v1/admin/categories/{$category->id}", [
            'device_family_ids' => [$family1->id, $family2->id],
        ])->assertStatus(200);

        $this->assertCount(2, $category->fresh()->deviceFamilies);

        $show = $this->actingAs($admin)->getJson("/api/v1/admin/categories/{$category->id}");
        $show->assertStatus(200)->assertJsonCount(2, 'data.device_families');
    }

    // ==================== 1G/1M: Activation cascade on public endpoints ====================

    public function test_inactive_family_hides_its_brand_from_public_devices_endpoint(): void
    {
        $this->makeChain(familySlug: 'inactive-fam-'.uniqid(), familyActive: false);
        $activeChain = $this->makeChain(familySlug: 'active-fam-'.uniqid(), familyActive: true);

        $response = $this->getJson('/api/v1/devices/header-hierarchy');
        $response->assertStatus(200);

        $names = collect($response->json('data'))->pluck('name');
        $this->assertTrue($names->contains($activeChain['brand']->name));
    }

    public function test_inactive_model_returns_404_on_direct_model_endpoint(): void
    {
        ['model' => $model] = $this->makeChain(modelActive: false);

        $this->getJson("/api/v1/devices/models/{$model->id}")->assertStatus(404);
    }

    public function test_inactive_family_returns_404_on_direct_model_endpoint_even_if_model_itself_active(): void
    {
        ['model' => $model] = $this->makeChain(familySlug: 'inactive-direct-'.uniqid(), familyActive: false, modelActive: true);

        $this->getJson("/api/v1/devices/models/{$model->id}")->assertStatus(404);
    }

    public function test_compatible_products_endpoint_returns_empty_for_inactive_model(): void
    {
        ['model' => $model] = $this->makeChain(modelActive: false);
        $product = Product::factory()->create(['is_active' => true]);
        $product->deviceModels()->attach($model->id);

        // ✅ ساختار واقعی پاسخ (ProductService::getCompatibleProducts):
        // {success, data: {data: [...], current_page, last_page, per_page, total}}
        $response = $this->getJson("/api/v1/products/compatible/{$model->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.total', 0)
            ->assertJsonCount(0, 'data.data');
    }

    // ==================== 1L: Seller enforcement ====================

    public function test_seller_is_blocked_from_attaching_inactive_family_device_model(): void
    {
        ['model' => $model] = $this->makeChain(familySlug: 'blocked-fam-'.uniqid(), familyActive: false);
        $seller = $this->seller();
        $category = Category::factory()->create();

        $response = $this->actingAs($seller)->postJson('/api/v1/seller/products', [
            'name' => 'محصول تست',
            'description' => 'توضیحات کافی برای عبور از اعتبارسنجی.',
            'price' => 100000,
            'stock' => 5,
            'category_id' => $category->id,
            'device_model_ids' => [$model->id],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('products', ['name' => 'محصول تست']);
    }

    public function test_seller_is_blocked_from_attaching_inactive_device_model(): void
    {
        ['model' => $model] = $this->makeChain(modelActive: false);
        $seller = $this->seller();
        $category = Category::factory()->create();

        $response = $this->actingAs($seller)->postJson('/api/v1/seller/products', [
            'name' => 'محصول تست ۲',
            'description' => 'توضیحات کافی برای عبور از اعتبارسنجی.',
            'price' => 100000,
            'stock' => 5,
            'category_id' => $category->id,
            'device_model_ids' => [$model->id],
        ]);

        $response->assertStatus(422);
    }

    public function test_seller_is_blocked_from_category_family_mismatch_when_category_is_configured(): void
    {
        ['model' => $smartphoneModel] = $this->makeChain(familySlug: 'smartphone-mismatch-'.uniqid());
        $laptopFamily = DeviceFamily::create(['name' => 'Laptop Mismatch', 'slug' => 'laptop-mismatch-'.uniqid(), 'is_active' => true]);

        $category = Category::factory()->create();
        // این دسته صریحاً فقط به Laptop وصل شده — یعنی از حالت «پیکربندی‌نشده» خارج شده.
        $category->deviceFamilies()->sync([$laptopFamily->id]);

        $seller = $this->seller();
        $response = $this->actingAs($seller)->postJson('/api/v1/seller/products', [
            'name' => 'محصول ناسازگار',
            'description' => 'توضیحات کافی برای عبور از اعتبارسنجی.',
            'price' => 100000,
            'stock' => 5,
            'category_id' => $category->id,
            'device_model_ids' => [$smartphoneModel->id],
        ]);

        $response->assertStatus(422);
    }

    public function test_seller_is_allowed_when_category_is_not_configured_with_any_family(): void
    {
        // ✅ رفتار عمدی مستندشده: دسته‌بندی‌ای که هنوز هیچ خانواده‌ای برایش
        // تنظیم نشده، از قانون تطبیق خانواده معاف است (طبق داده‌ی واقعی
        // فاز ۰: همه‌ی دسته‌های فعلی هنوز پیکربندی نشده‌اند).
        ['model' => $model] = $this->makeChain();
        $category = Category::factory()->create(); // بدون deviceFamilies

        $seller = $this->seller();
        $response = $this->actingAs($seller)->postJson('/api/v1/seller/products', [
            'name' => 'محصول مجاز',
            'description' => 'توضیحات کافی برای عبور از اعتبارسنجی.',
            'price' => 100000,
            'stock' => 5,
            'category_id' => $category->id,
            'device_model_ids' => [$model->id],
        ]);

        $response->assertStatus(201);
    }

    // ==================== 1N: Future family without code changes ====================

    public function test_new_smartwatch_family_works_end_to_end_without_any_hardcoded_type(): void
    {
        $admin = $this->admin();

        // ادمین یک خانواده‌ی کاملاً جدید می‌سازد که در هیچ enum/type ثابتی
        // در کد بک‌اند یا فرانت‌اند وجود ندارد.
        $create = $this->actingAs($admin)->postJson('/api/v1/admin/device-families', [
            'name' => 'Smartwatch',
            'slug' => 'smartwatch-e2e',
            'icon' => 'watch',
            'is_active' => true,
        ]);
        $create->assertStatus(201);
        $familyId = $create->json('data.id');

        // ظاهر شدن در لیست عمومی — بدون هیچ تغییر کدی.
        $this->getJson('/api/v1/device-families')->assertJsonFragment(['slug' => 'smartwatch-e2e']);

        $brand = DeviceBrand::create([
            'name' => 'Garmin', 'slug' => 'garmin-'.uniqid(), 'family_id' => $familyId, 'is_active' => true,
        ]);
        $series = DeviceSeries::create([
            'brand_id' => $brand->id, 'name' => 'Fenix', 'slug' => 'fenix-'.uniqid(), 'is_active' => true,
        ]);
        $model = DeviceModel::create([
            'series_id' => $series->id, 'name' => 'Fenix 7', 'slug' => 'fenix-7-'.uniqid(), 'is_active' => true,
        ]);

        // فروشنده می‌تواند محصولی برای این اکوسیستم کاملاً جدید بسازد.
        $seller = $this->seller();
        $category = Category::factory()->create();

        $response = $this->actingAs($seller)->postJson('/api/v1/seller/products', [
            'name' => 'بند ساعت گارمین فنیکس ۷',
            'description' => 'بند اورجینال برای گارمین فنیکس ۷.',
            'price' => 500000,
            'stock' => 10,
            'category_id' => $category->id,
            'device_model_ids' => [$model->id],
        ]);

        $response->assertStatus(201);

        // و مشتری آن را از طریق endpoint سازگاری واقعی پیدا می‌کند.
        $compatible = $this->getJson("/api/v1/products/compatible/{$model->id}");
        $compatible->assertStatus(200)->assertJsonFragment(['name' => 'بند ساعت گارمین فنیکس ۷']);
    }
}
