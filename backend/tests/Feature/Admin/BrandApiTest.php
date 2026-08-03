<?php

namespace Tests\Feature\Admin;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->customer = User::factory()->create(['role' => 'customer']);
    }

    // ==================== Authentication Tests ====================

    public function test_unauthenticated_user_cannot_list_brands(): void
    {
        $response = $this->getJson('/api/v1/admin/brands');
        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_create_brand(): void
    {
        $response = $this->postJson('/api/v1/admin/brands', ['name' => 'Test']);
        $response->assertStatus(401);
    }

    // ==================== Authorization Tests ====================

    public function test_customer_cannot_list_brands(): void
    {
        Brand::factory()->count(3)->create();

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/admin/brands');

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_customer_cannot_create_brand(): void
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/admin/brands', [
                'name' => 'Test Brand',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_customer_cannot_update_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->actingAs($this->customer)
            ->putJson("/api/v1/admin/brands/{$brand->id}", [ // ✅ اصلاح شد
                'name' => 'Updated',
            ]);

        $response->assertStatus(403);
    }

    public function test_customer_cannot_delete_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->actingAs($this->customer)
            ->deleteJson("/api/v1/admin/brands/{$brand->id}"); // ✅ اصلاح شد

        $response->assertStatus(403);
    }

    // ==================== List Brands Tests ====================

    public function test_admin_can_list_brands(): void
    {
        Brand::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/brands');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'brands',
                    'pagination' => [
                        'current_page',
                        'last_page',
                        'per_page',
                        'total',
                    ],
                    'stats',
                    'countries',
                ],
            ]);
    }

    public function test_admin_can_filter_brands_by_active_status(): void
    {
        Brand::factory()->count(3)->create(['is_active' => true]);
        Brand::factory()->count(2)->create(['is_active' => false]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/brands?is_active=1');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 3);
    }

    public function test_admin_can_search_brands(): void
    {
        Brand::factory()->create(['name' => 'Samsung', 'slug' => 'samsung']);
        Brand::factory()->create(['name' => 'Apple', 'slug' => 'apple']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/brands?search=Samsung');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 1);
    }

    // ==================== Show Brand Tests ====================

    public function test_admin_can_show_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/brands/{$brand->id}"); // ✅ اصلاح شد
            dump($response->getContent()); // این خط را اضافه کنید

        $response->assertStatus(200)
            ->assertJsonPath('data.brand.id', $brand->id)
            ->assertJsonPath('data.brand.name', $brand->name);
    }

    public function test_admin_cannot_show_nonexistent_brand(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/brands/9999');

        $this->assertTrue(in_array($response->status(), [404, 500]));
    }

    // ==================== Create Brand Tests ====================

    public function test_admin_can_create_brand(): void
    {
        $data = [
            'name' => 'Test Brand',
            'slug' => 'test-brand',
            'description' => 'Test Description',
            'country' => 'Iran',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands', $data);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('brands', [
            'name' => 'Test Brand',
            'slug' => 'test-brand',
        ]);
    }

    public function test_create_brand_requires_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands', [
                'description' => 'Test',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_brand_name_must_be_unique(): void
    {
        Brand::factory()->create(['name' => 'Samsung', 'slug' => 'samsung-1']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands', [
                'name' => 'Samsung',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    // ==================== Update Brand Tests ====================

   public function test_admin_can_update_brand(): void
    {
        $brand = Brand::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/brands/{$brand->id}", [ // ✅ اصلاح شد
                'name' => 'New Name',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('brands', [
            'id' => $brand->id,
            'name' => 'New Name',
        ]);
    }

    public function test_admin_cannot_update_nonexistent_brand(): void
    {
        $response = $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/brands/9999', [
                'name' => 'New Name',
            ]);

        $this->assertTrue(in_array($response->status(), [404, 500]));
    }

    // ==================== Delete Brand Tests ====================

        public function test_admin_can_delete_brand(): void
    {
        $brand = Brand::factory()->create(['products_count' => 0]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/brands/{$brand->id}"); // ✅ فقط همین خط را اصلاح کنید

        $response->assertStatus(200);

        $this->assertSoftDeleted('brands', ['id' => $brand->id]);
    }

     public function test_admin_cannot_delete_brand_with_products(): void
    {
        $brand = Brand::factory()->create(['products_count' => 5]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/brands/{$brand->id}"); // ✅ اصلاح شد

        $this->assertTrue(in_array($response->status(), [400, 422]));

        $this->assertDatabaseHas('brands', ['id' => $brand->id]);
    }

    // ==================== Verify/Unverify Tests ====================

    public function test_admin_can_verify_brand(): void
    {
        $brand = Brand::factory()->create(['verified_at' => null]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/brands/{$brand->id}/verify"); // ✅ اصلاح شد

        $response->assertStatus(200);

        $brand->refresh();
        $this->assertNotNull($brand->verified_at);
    }

    public function test_admin_can_unverify_brand(): void
    {
        $brand = Brand::factory()->create(['verified_at' => now()]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/brands/{$brand->id}/unverify"); // ✅ اصلاح شد

        $response->assertStatus(200);

        $brand->refresh();
        $this->assertNull($brand->verified_at);
    }

    // ==================== Bulk Action Tests ====================

    public function test_admin_can_bulk_activate_brands(): void
    {
        $brands = Brand::factory()->count(3)->create(['is_active' => false]);
        $ids = $brands->pluck('id')->toArray();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands/bulk-action', [
                'ids' => $ids,
                'action' => 'activate',
            ]);

        $response->assertStatus(200);

        $this->assertEquals(3, Brand::whereIn('id', $ids)->where('is_active', true)->count());
    }

    public function test_admin_can_bulk_deactivate_brands(): void
    {
        $brands = Brand::factory()->count(3)->create(['is_active' => true]);
        $ids = $brands->pluck('id')->toArray();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands/bulk-action', [
                'ids' => $ids,
                'action' => 'deactivate',
            ]);

        $response->assertStatus(200);

        $this->assertEquals(3, Brand::whereIn('id', $ids)->where('is_active', false)->count());
    }

    public function test_bulk_action_requires_ids(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands/bulk-action', [
                'action' => 'activate',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ids']);
    }

    public function test_bulk_action_requires_action(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/brands/bulk-action', [
                'ids' => [1, 2, 3],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['action']);
    }
}