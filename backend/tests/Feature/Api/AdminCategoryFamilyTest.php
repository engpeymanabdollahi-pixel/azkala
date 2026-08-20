<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\DeviceFamily;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز B: مدیریت device_family_ids روی
 * create/update دسته‌بندی — نه endpoint جدید (already covered by
 * store()/update() موجود از فاز ۱I)، فقط الزام جدیدِ این فاز: family
 * غیرفعال نباید قابل‌اتصال باشد.
 */
class AdminCategoryFamilyTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    private function makeFamily(bool $active = true): DeviceFamily
    {
        return DeviceFamily::create(['name' => 'Family '.uniqid(), 'slug' => 'family-'.uniqid(), 'is_active' => $active]);
    }

    public function test_admin_can_assign_active_families_to_a_category(): void
    {
        $family = $this->makeFamily();

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/categories', [
            'name' => 'شارژر و کابل',
            'device_family_ids' => [$family->id],
        ]);

        $response->assertStatus(201);
        $categoryId = $response->json('data.id');
        $this->assertDatabaseHas('category_device_family', [
            'category_id' => $categoryId,
            'device_family_id' => $family->id,
        ]);
    }

    public function test_inactive_family_cannot_be_assigned(): void
    {
        $inactiveFamily = $this->makeFamily(false);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/categories', [
            'name' => 'دسته تست',
            'device_family_ids' => [$inactiveFamily->id],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['device_family_ids.0']);
    }

    public function test_admin_can_update_family_assignment(): void
    {
        $familyA = $this->makeFamily();
        $familyB = $this->makeFamily();
        $category = Category::factory()->create();
        $category->deviceFamilies()->sync([$familyA->id]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/categories/{$category->id}", [
                'device_family_ids' => [$familyB->id],
            ]);

        $response->assertOk();
        $this->assertDatabaseMissing('category_device_family', ['category_id' => $category->id, 'device_family_id' => $familyA->id]);
        $this->assertDatabaseHas('category_device_family', ['category_id' => $category->id, 'device_family_id' => $familyB->id]);
    }

    public function test_category_list_includes_device_families_and_is_global(): void
    {
        $family = $this->makeFamily();
        $withFamily = Category::factory()->create();
        $withFamily->deviceFamilies()->sync([$family->id]);
        $global = Category::factory()->create();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/categories');

        $response->assertOk();
        $items = collect($response->json('data.categories'));
        $withFamilyRow = $items->firstWhere('id', $withFamily->id);
        $globalRow = $items->firstWhere('id', $global->id);

        $this->assertFalse($withFamilyRow['is_global']);
        $this->assertSame($family->id, $withFamilyRow['device_families'][0]['id']);
        $this->assertTrue($globalRow['is_global']);
        $this->assertCount(0, $globalRow['device_families']);
    }
}
