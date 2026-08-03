<?php

namespace Tests\Feature\Api;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    private function makeNotification(User $user, array $overrides = []): Notification
    {
        return Notification::create(array_merge([
            'user_id' => $user->id,
            'type' => 'order_placed',
            'title' => 'سفارش ثبت شد',
            'message' => 'سفارش شما با موفقیت ثبت شد',
        ], $overrides));
    }

    public function test_unauthenticated_user_cannot_list_notifications(): void
    {
        $this->getJson('/api/v1/user/notifications')->assertStatus(401);
    }

    public function test_index_only_returns_own_notifications(): void
    {
        $this->makeNotification($this->user, ['title' => 'مال من']);
        $this->makeNotification($this->otherUser, ['title' => 'مال دیگری']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/user/notifications');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('مال من', $response->json('data.0.title'));
    }

    public function test_user_can_mark_own_notification_as_read(): void
    {
        $notification = $this->makeNotification($this->user);
        $this->assertNull($notification->read_at);

        $this->actingAs($this->user)
            ->postJson("/api/v1/user/notifications/{$notification->id}/read")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $notification = $this->makeNotification($this->otherUser);

        $this->actingAs($this->user)
            ->postJson("/api/v1/user/notifications/{$notification->id}/read")
            ->assertStatus(404);

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_mark_all_as_read_only_affects_own_notifications(): void
    {
        $mine = $this->makeNotification($this->user);
        $theirs = $this->makeNotification($this->otherUser);

        $this->actingAs($this->user)
            ->postJson('/api/v1/user/notifications/read-all')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertNotNull($mine->fresh()->read_at);
        $this->assertNull($theirs->fresh()->read_at);
    }

    public function test_mark_all_as_read_leaves_already_read_timestamps_untouched(): void
    {
        $readAt = now()->subDay();
        $alreadyRead = $this->makeNotification($this->user, ['read_at' => $readAt]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/user/notifications/read-all')
            ->assertStatus(200);

        $this->assertSame(
            $readAt->toDateTimeString(),
            $alreadyRead->fresh()->read_at->toDateTimeString()
        );
    }
}
