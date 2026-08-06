<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    /**
     * ✅ approveSeller() («تایید یک‌کلیکی فروشنده») کاملاً از سرویس، ریپازیتوری،
     * کنترلر و روت حذف شد — این دکمه در تب کاربران پنل ادمین کاملاً موازی و
     * مستقل از خط‌لولهٔ واقعی درخواست فروشندگی بود؛ چون shop_name/مدارک/
     * اطلاعات بانکی هیچ‌وقت جمع‌آوری نمی‌شد، فروشندهٔ «تاییدشده» با آن
     * هیچ‌وقت slug نمی‌گرفت و صفحه‌ی عمومی /seller/:slug او برای همیشه
     * ۴۰۴ می‌داد. این تست تضمین می‌کند مسیر قدیمی دیگر قابل دسترسی نیست.
     */
    public function test_the_legacy_one_click_approve_seller_route_no_longer_exists(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/users/{$customer->id}/approve-seller")
            ->assertStatus(404);

        $this->assertSame('customer', $customer->fresh()->role);
    }

    /**
     * لغو فروشندگیِ یک فروشندهٔ از قبل تاییدشده همچنان یک اقدام واقعی و
     * مستقل است (مثلاً به‌خاطر تخلف) — برخلاف approveSeller حذف نشده است.
     */
    public function test_admin_can_revoke_an_already_approved_seller(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/users/{$seller->id}/reject-seller", ['reason' => 'تخلف در قوانین فروش'])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame('customer', $seller->fresh()->role);
    }
}
