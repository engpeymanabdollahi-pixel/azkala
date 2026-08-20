<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\DeviceFamily;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز B5/C2: GET /categories?family_id=X — فقط
 * دسته‌های همان خانواده + دسته‌های سراسری (بدون هیچ خانواده‌ای) نمایش
 * داده شوند.
 */
class StorefrontCategoryFilterTest extends TestCase
{
    use RefreshDatabase;

    private function makeFamily(bool $active = true): DeviceFamily
    {
        return DeviceFamily::create(['name' => 'Family '.uniqid(), 'slug' => 'family-'.uniqid(), 'is_active' => $active]);
    }

    public function test_family_filter_includes_matching_and_global_categories(): void
    {
        $familyA = $this->makeFamily();
        $familyB = $this->makeFamily();

        $matching = Category::factory()->create(['is_active' => true, 'parent_id' => null]);
        $matching->deviceFamilies()->sync([$familyA->id]);

        $other = Category::factory()->create(['is_active' => true, 'parent_id' => null]);
        $other->deviceFamilies()->sync([$familyB->id]);

        $global = Category::factory()->create(['is_active' => true, 'parent_id' => null]);

        $response = $this->getJson("/api/v1/categories?family_id={$familyA->id}");

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($matching->id));
        $this->assertTrue($ids->contains($global->id));
        $this->assertFalse($ids->contains($other->id));
    }

    public function test_without_family_filter_all_active_root_categories_are_returned(): void
    {
        $familyA = $this->makeFamily();
        $withFamily = Category::factory()->create(['is_active' => true, 'parent_id' => null]);
        $withFamily->deviceFamilies()->sync([$familyA->id]);
        $global = Category::factory()->create(['is_active' => true, 'parent_id' => null]);

        $response = $this->getJson('/api/v1/categories');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($withFamily->id));
        $this->assertTrue($ids->contains($global->id));
    }

    public function test_response_exposes_device_families_and_is_global(): void
    {
        $family = $this->makeFamily();
        $category = Category::factory()->create(['is_active' => true, 'parent_id' => null]);
        $category->deviceFamilies()->sync([$family->id]);

        $response = $this->getJson('/api/v1/categories');

        $row = collect($response->json('data'))->firstWhere('id', $category->id);
        $this->assertFalse($row['is_global']);
        $this->assertSame($family->id, $row['device_families'][0]['id']);
    }
}
