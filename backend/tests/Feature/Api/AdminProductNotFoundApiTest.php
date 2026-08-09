<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً AdminProductService::quickUpdate/deleteProduct هر دو
 * ModelNotFoundException را داخل catch(\Exception) عمومی می‌گرفتند و به یک
 * Exception(500) عمومی تبدیل می‌کردند — یعنی به‌روزرسانی سریع یا حذف یک
 * محصول ناموجود به‌جای پاسخ تمیز ۴۰۴، ۵۰۰ می‌گرفت.
 */
class AdminProductNotFoundApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_quick_update_on_nonexistent_product_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/products/9999/quick-update', ['price' => 1000]);

        $response->assertStatus(404);
    }

    public function test_delete_nonexistent_product_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/v1/admin/products/9999');

        $response->assertStatus(404);
    }
}
