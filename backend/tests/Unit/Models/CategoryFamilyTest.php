<?php

namespace Tests\Unit\Models;

use App\Models\Category;
use App\Models\DeviceFamily;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Marketplace Unification فاز B2: Category::scopeForFamily() و
 * Category::isGlobal().
 */
class CategoryFamilyTest extends TestCase
{
    use RefreshDatabase;

    public function test_scope_for_family_includes_global_categories(): void
    {
        $family = DeviceFamily::create(['name' => 'F', 'slug' => 'f-'.uniqid(), 'is_active' => true]);
        $global = Category::factory()->create();
        $matching = Category::factory()->create();
        $matching->deviceFamilies()->sync([$family->id]);
        $other = Category::factory()->create();
        $otherFamily = DeviceFamily::create(['name' => 'O', 'slug' => 'o-'.uniqid(), 'is_active' => true]);
        $other->deviceFamilies()->sync([$otherFamily->id]);

        $ids = Category::forFamily($family->id)->pluck('id');

        $this->assertTrue($ids->contains($global->id));
        $this->assertTrue($ids->contains($matching->id));
        $this->assertFalse($ids->contains($other->id));
    }

    public function test_is_global_reflects_absence_of_families(): void
    {
        $family = DeviceFamily::create(['name' => 'F2', 'slug' => 'f2-'.uniqid(), 'is_active' => true]);
        $global = Category::factory()->create();
        $withFamily = Category::factory()->create();
        $withFamily->deviceFamilies()->sync([$family->id]);

        $this->assertTrue($global->isGlobal());
        $this->assertFalse($withFamily->fresh()->isGlobal());
    }
}
