<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminChatMonitorApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_list_conversations(): void
    {
        Conversation::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/chat-management/monitor');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['conversations', 'pagination']]);
    }

    public function test_admin_can_view_conversation_detail(): void
    {
        $conversation = Conversation::factory()->create();
        Message::factory()->count(2)->create(['conversation_id' => $conversation->id]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/chat-management/monitor/{$conversation->id}");

        $response->assertStatus(200)->assertJsonPath('success', true);
    }

    public function test_admin_can_intervene_in_a_conversation(): void
    {
        $conversation = Conversation::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/monitor/{$conversation->id}/intervene", [
                'message' => 'پیام از طرف پشتیبانی',
            ]);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $this->admin->id,
            'content' => 'پیام از طرف پشتیبانی',
            'type' => 'system',
        ]);
    }

    public function test_admin_can_close_a_conversation(): void
    {
        $conversation = Conversation::factory()->active()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/monitor/{$conversation->id}/close");

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('conversations', ['id' => $conversation->id, 'is_active' => false]);
    }

    /**
     * ✅ قبلاً avg_response_time همیشه عدد ثابت ۵ بود، مستقل از داده‌های
     * واقعی — همان باگی که در AdminDashboardService هم قبلاً وجود داشت.
     */
    public function test_stats_computes_real_average_response_time(): void
    {
        $conversation = Conversation::factory()->create();
        $buyer = User::factory()->create(['role' => 'customer']);
        $seller = User::factory()->create(['role' => 'seller']);

        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $buyer->id,
            'created_at' => now()->subMinutes(30),
        ]);
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $seller->id,
            'created_at' => now()->subMinutes(20), // ۱۰ دقیقه بعد از پیام خریدار
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/chat-management/monitor/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.avg_response_time', 10);
    }

    /**
     * ✅ قبلاً conversion_rate از فرمول (کل مکالمات / کل پیام‌ها) محاسبه
     * می‌شد که هیچ معنایی نداشت. اینجا باید واقعاً نسبت مکالماتی که به خرید
     * همان محصول از همان فروشنده منجر شده‌اند محاسبه شود.
     */
    public function test_stats_computes_real_conversion_rate(): void
    {
        $buyer = User::factory()->create(['role' => 'customer']);
        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $seller->id]);

        // مکالمه‌ای که به خرید منجر شده
        Conversation::factory()->create([
            'buyer_id' => $buyer->id,
            'seller_id' => $seller->id,
            'product_id' => $product->id,
            'created_at' => now()->subDays(2),
        ]);
        $order = Order::factory()->create([
            'user_id' => $buyer->id,
            'created_at' => now()->subDay(),
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => $seller->id,
        ]);

        // مکالمه‌ای که به خرید منجر نشده
        $otherProduct = Product::factory()->create(['seller_id' => $seller->id]);
        Conversation::factory()->create([
            'buyer_id' => $buyer->id,
            'seller_id' => $seller->id,
            'product_id' => $otherProduct->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/chat-management/monitor/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.conversion_rate', 50);
    }

    /**
     * ✅ روت /critical که قبلاً به رابطهٔ ناموجود Message::sentiment() ارجاع
     * می‌داد و بلافاصله کرش می‌کرد، حذف شد — دیگر نباید هیچ روتی به آن
     * اشاره کند.
     */
    public function test_the_broken_critical_route_no_longer_exists(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/chat-management/monitor/critical');

        $response->assertStatus(404);
    }
}
