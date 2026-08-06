<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_list_orders(): void
    {
        Order::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/orders');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['orders', 'pagination', 'stats', 'sellers'],
            ]);
    }

    public function test_non_admin_cannot_list_orders(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/orders');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_order_details(): void
    {
        $order = Order::factory()->create();

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $order->id);
    }

    public function test_admin_can_update_order_status(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'processing']);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'processing']);
    }

    /**
     * ✅ قبلاً enum دیتابیس status فقط pending/processing/shipped/delivered/cancelled
     * را می‌پذیرفت و 'returned' اصلاً در آن نبود، در حالی که فرانت‌اند پنل
     * ادمین (فیلتر و مودال تغییر وضعیت) این گزینه را کامل پیاده‌سازی کرده
     * بود — انتخاب «مرجوعی» همیشه با خطای اعتبارسنجی ۴۲۲ شکست می‌خورد.
     */
    public function test_admin_can_mark_an_order_as_returned(): void
    {
        $order = Order::factory()->create(['status' => 'delivered']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'returned']);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'returned']);
    }

    public function test_admin_order_stats_count_returned_orders(): void
    {
        Order::factory()->count(2)->create(['status' => 'returned']);
        Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/orders/stats');

        $response->assertStatus(200);

        $listResponse = $this->actingAs($this->admin)->getJson('/api/v1/admin/orders');
        $listResponse->assertJsonPath('data.stats.returned', 2);
    }

    /**
     * ✅ قبلاً tracking_number و notes در $request->validate() نبودند،
     * بنابراین همیشه از خروجی validated() حذف می‌شدند و در سرویس/ریپازیتوری
     * (که منطق ذخیرهٔ آن‌ها را داشتند) هرگز اجرا نمی‌شدند — فیلدهای کد
     * پیگیری و یادداشت در مودال تغییر وضعیت پنل ادمین همیشه نادیده گرفته
     * می‌شدند.
     */
    public function test_admin_can_set_tracking_number_and_notes_when_updating_status(): void
    {
        $order = Order::factory()->create(['status' => 'processing']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'shipped',
                'tracking_number' => 'TRACK12345',
                'notes' => 'ارسال با پست پیشتاز',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'shipped',
            'tracking_number' => 'TRACK12345',
            'notes' => 'ارسال با پست پیشتاز',
        ]);
    }

    public function test_admin_can_update_payment_status(): void
    {
        $order = Order::factory()->create(['payment_status' => 'pending']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/orders/{$order->id}/payment-status", ['payment_status' => 'paid']);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'payment_status' => 'paid']);
    }

    public function test_admin_can_filter_orders_by_status(): void
    {
        Order::factory()->count(2)->create(['status' => 'pending']);
        Order::factory()->create(['status' => 'cancelled']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/orders?status=pending');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 2);
    }
}
