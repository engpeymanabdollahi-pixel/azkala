<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\ProductRelationship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Product Relationship Phase 2: «همراه این محصول» (complement) — مدیریت
 * توسط فروشنده. طبق تصمیم Hybrid ownership (Phase 2 audit)، فروشنده فقط
 * می‌تواند بین دو محصولِ خودش رابطه بسازد — نه به محصول فروشنده‌ی دیگر.
 */
class SellerProductRelationshipTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;

    protected User $otherSeller;

    protected Product $source;

    protected Product $target;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seller = User::factory()->create(['role' => 'seller']);
        $this->otherSeller = User::factory()->create(['role' => 'seller']);

        $this->source = Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => true]);
        $this->target = Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => true]);
    }

    public function test_seller_can_create_complement_relationship_between_own_products(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
                'target_product_id' => $this->target->id,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_relationships', [
            'source_product_id' => $this->source->id,
            'target_product_id' => $this->target->id,
            'type' => 'complement',
            'is_active' => 1,
        ]);
    }

    public function test_seller_can_list_relationships_for_own_product(): void
    {
        ProductRelationship::factory()->create([
            'source_product_id' => $this->source->id,
            'target_product_id' => $this->target->id,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->getJson("/api/v1/seller/products/{$this->source->id}/relationships");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame($this->target->id, $response->json('data.0.target_product.id'));
    }

    public function test_duplicate_relationship_is_rejected(): void
    {
        ProductRelationship::factory()->create([
            'source_product_id' => $this->source->id,
            'target_product_id' => $this->target->id,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
                'target_product_id' => $this->target->id,
            ]);

        $response->assertStatus(422);
        $this->assertSame(1, ProductRelationship::where('source_product_id', $this->source->id)
            ->where('target_product_id', $this->target->id)->count());
    }

    public function test_self_reference_is_rejected(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
                'target_product_id' => $this->source->id,
            ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('product_relationships', [
            'source_product_id' => $this->source->id,
            'target_product_id' => $this->source->id,
        ]);
    }

    /**
     * IDOR: فروشنده نباید بتواند برای محصول فروشنده‌ی دیگر رابطه بسازد
     * (source متعلق به فروشنده‌ی دیگر).
     */
    public function test_seller_cannot_create_relationship_on_another_sellers_product(): void
    {
        $otherProduct = Product::factory()->create(['seller_id' => $this->otherSeller->id, 'is_active' => true]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$otherProduct->id}/relationships", [
                'target_product_id' => $this->target->id,
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('product_relationships', ['source_product_id' => $otherProduct->id]);
    }

    /**
     * IDOR: فروشنده نباید بتواند محصول فروشنده‌ی دیگر را به‌عنوان «مکمل»
     * محصول خودش معرفی کند — دقیقاً همان ریسک spam/self-promotion که Phase
     * 2 audit صراحتاً مستند کرده بود.
     */
    public function test_seller_cannot_target_another_sellers_product(): void
    {
        $otherProduct = Product::factory()->create(['seller_id' => $this->otherSeller->id, 'is_active' => true]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
                'target_product_id' => $otherProduct->id,
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('product_relationships', ['target_product_id' => $otherProduct->id]);
    }

    public function test_inactive_target_product_is_rejected(): void
    {
        $inactiveTarget = Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => false]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
                'target_product_id' => $inactiveTarget->id,
            ]);

        $response->assertStatus(404);
    }

    public function test_inactive_source_product_is_rejected(): void
    {
        $inactiveSource = Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => false]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$inactiveSource->id}/relationships", [
                'target_product_id' => $this->target->id,
            ]);

        $response->assertStatus(404);
    }

    /**
     * محصولِ soft-deleted باید مثل ناموجود رفتار شود — Product::query()
     * خودش global scope حذف نرم را اعمال می‌کند.
     */
    public function test_deleted_target_product_is_rejected(): void
    {
        $deletedTarget = Product::factory()->create(['seller_id' => $this->seller->id, 'is_active' => true]);
        $deletedTarget->delete();

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
                'target_product_id' => $deletedTarget->id,
            ]);

        $response->assertStatus(404);
    }

    public function test_seller_can_delete_own_relationship(): void
    {
        $relationship = ProductRelationship::factory()->create([
            'source_product_id' => $this->source->id,
            'target_product_id' => $this->target->id,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->deleteJson("/api/v1/seller/products/{$this->source->id}/relationships/{$relationship->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('product_relationships', ['id' => $relationship->id]);
    }

    /**
     * IDOR روی delete: فروشنده نباید بتواند رابطه‌ی متعلق به محصول
     * فروشنده‌ی دیگر را حذف کند.
     */
    public function test_seller_cannot_delete_another_sellers_relationship(): void
    {
        $otherSource = Product::factory()->create(['seller_id' => $this->otherSeller->id, 'is_active' => true]);
        $otherTarget = Product::factory()->create(['seller_id' => $this->otherSeller->id, 'is_active' => true]);
        $relationship = ProductRelationship::factory()->create([
            'source_product_id' => $otherSource->id,
            'target_product_id' => $otherTarget->id,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->deleteJson("/api/v1/seller/products/{$otherSource->id}/relationships/{$relationship->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('product_relationships', ['id' => $relationship->id]);
    }

    public function test_guest_cannot_manage_relationships(): void
    {
        $response = $this->postJson("/api/v1/seller/products/{$this->source->id}/relationships", [
            'target_product_id' => $this->target->id,
        ]);

        $response->assertStatus(401);
    }
}
