<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\ProductRelationship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Product Relationship Phase 2: مدیریت «مکمل» توسط ادمین — طبق تصمیم
 * Hybrid ownership، ادمین بدون محدودیت مالکیت می‌تواند بین هر دو محصول
 * فعال (حتی متعلق به دو فروشنده‌ی متفاوت) رابطه بسازد.
 */
class AdminProductRelationshipTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $sellerA;

    protected User $sellerB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->sellerA = User::factory()->create(['role' => 'seller']);
        $this->sellerB = User::factory()->create(['role' => 'seller']);
    }

    public function test_admin_can_create_relationship_across_two_different_sellers(): void
    {
        $productA = Product::factory()->create(['seller_id' => $this->sellerA->id, 'is_active' => true]);
        $productB = Product::factory()->create(['seller_id' => $this->sellerB->id, 'is_active' => true]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/products/{$productA->id}/relationships", [
                'target_product_id' => $productB->id,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_relationships', [
            'source_product_id' => $productA->id,
            'target_product_id' => $productB->id,
        ]);
    }

    public function test_admin_self_reference_is_rejected(): void
    {
        $product = Product::factory()->create(['seller_id' => $this->sellerA->id, 'is_active' => true]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/products/{$product->id}/relationships", [
                'target_product_id' => $product->id,
            ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_list_and_delete_relationship(): void
    {
        $productA = Product::factory()->create(['seller_id' => $this->sellerA->id, 'is_active' => true]);
        $productB = Product::factory()->create(['seller_id' => $this->sellerB->id, 'is_active' => true]);
        $relationship = ProductRelationship::factory()->create([
            'source_product_id' => $productA->id,
            'target_product_id' => $productB->id,
        ]);

        $listResponse = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/products/{$productA->id}/relationships");
        $listResponse->assertOk();
        $this->assertCount(1, $listResponse->json('data'));

        $deleteResponse = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/products/{$productA->id}/relationships/{$relationship->id}");
        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('product_relationships', ['id' => $relationship->id]);
    }

    /**
     * غیر-ادمین (فروشنده) نباید بتواند از مسیر ادمین رابطه بسازد — گارد
     * permission:products.manage باید همچنان اجرا شود.
     */
    public function test_non_admin_cannot_use_admin_relationship_routes(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $productA = Product::factory()->create(['seller_id' => $this->sellerA->id, 'is_active' => true]);
        $productB = Product::factory()->create(['seller_id' => $this->sellerB->id, 'is_active' => true]);

        $response = $this->actingAs($seller)
            ->postJson("/api/v1/admin/products/{$productA->id}/relationships", [
                'target_product_id' => $productB->id,
            ]);

        $response->assertStatus(403);
    }
}
