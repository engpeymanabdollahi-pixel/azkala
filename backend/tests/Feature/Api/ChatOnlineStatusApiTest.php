<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً روت POST /chat/online-status به ChatController::getOnlineStatus
 * اشاره می‌کرد که اصلاً پیاده‌سازی نشده بود — هر بار که ChatWidget یا
 * SellerChatPage آن را (هر چند ثانیه یک‌بار) صدا می‌زدند،
 * BadMethodCallException و ۵۰۰ می‌گرفتند.
 */
class ChatOnlineStatusApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $viewer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->viewer = User::factory()->create();
    }

    public function test_returns_online_status_for_recently_active_users(): void
    {
        $onlineUser = User::factory()->create(['last_seen_at' => now()->subMinutes(2)]);
        $offlineUser = User::factory()->create(['last_seen_at' => now()->subHours(3)]);

        $response = $this->actingAs($this->viewer)->postJson('/api/v1/chat/online-status', [
            'user_ids' => [$onlineUser->id, $offlineUser->id],
        ]);

        $response->assertStatus(200)->assertJsonPath('success', true);

        $data = collect($response->json('data'))->keyBy('id');
        $this->assertTrue($data[$onlineUser->id]['is_online']);
        $this->assertFalse($data[$offlineUser->id]['is_online']);
        // ✅ قبلاً diffInMinutes که float برمی‌گرداند مستقیم داخل رشته
        // جاگذاری می‌شد: «2.0028573666667 دقیقه پیش» به‌جای «۲ دقیقه پیش».
        $this->assertSame('2 دقیقه پیش', $data[$onlineUser->id]['last_seen']);
    }

    public function test_a_user_who_never_logged_in_is_reported_offline(): void
    {
        $neverSeen = User::factory()->create(['last_seen_at' => null]);

        $response = $this->actingAs($this->viewer)->postJson('/api/v1/chat/online-status', [
            'user_ids' => [$neverSeen->id],
        ]);

        $response->assertStatus(200);
        $data = collect($response->json('data'))->keyBy('id');
        $this->assertFalse($data[$neverSeen->id]['is_online']);
        $this->assertSame('نامشخص', $data[$neverSeen->id]['last_seen']);
    }

    public function test_rejects_a_request_without_user_ids(): void
    {
        $response = $this->actingAs($this->viewer)->postJson('/api/v1/chat/online-status', []);

        $response->assertStatus(422);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/chat/online-status', ['user_ids' => [1]]);

        $response->assertStatus(401);
    }
}
