<?php

namespace Tests\Feature\Api;

use App\Models\BlockedUser;
use App\Models\ChatReport;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatModerationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $target;

    protected User $bystander;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->target = User::factory()->create();
        $this->bystander = User::factory()->create();
    }

    public function test_unauthenticated_user_cannot_block(): void
    {
        $this->postJson('/api/v1/chat/moderation/block', [
            'blocked_user_id' => $this->target->id,
        ])->assertStatus(401);
    }

    public function test_user_can_block_another_user(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/chat/moderation/block', [
                'blocked_user_id' => $this->target->id,
                'reason' => 'spam',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('blocked_users', [
            'user_id' => $this->user->id,
            'blocked_user_id' => $this->target->id,
        ]);
    }

    public function test_user_cannot_block_themselves(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/chat/moderation/block', [
                'blocked_user_id' => $this->user->id,
            ])
            ->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('blocked_users', 0);
    }

    public function test_blocking_deactivates_conversations_in_both_directions(): void
    {
        $asBuyer = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $this->target->id,
            'is_active' => true,
        ]);
        $asSeller = Conversation::create([
            'buyer_id' => $this->target->id,
            'seller_id' => $this->user->id,
            'is_active' => true,
        ]);
        $unrelated = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $this->bystander->id,
            'is_active' => true,
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/chat/moderation/block', ['blocked_user_id' => $this->target->id])
            ->assertStatus(201);

        $this->assertFalse((bool) $asBuyer->fresh()->is_active);
        $this->assertFalse((bool) $asSeller->fresh()->is_active);
        // A conversation with an unrelated third party must be untouched.
        $this->assertTrue((bool) $unrelated->fresh()->is_active);
    }

    public function test_blocking_twice_does_not_duplicate(): void
    {
        $payload = ['blocked_user_id' => $this->target->id];

        $this->actingAs($this->user)->postJson('/api/v1/chat/moderation/block', $payload)->assertStatus(201);
        $this->actingAs($this->user)->postJson('/api/v1/chat/moderation/block', $payload)->assertStatus(201);

        $this->assertSame(1, BlockedUser::where('user_id', $this->user->id)->count());
    }

    public function test_blocked_list_only_shows_own_blocks(): void
    {
        BlockedUser::create(['user_id' => $this->user->id, 'blocked_user_id' => $this->target->id]);
        BlockedUser::create(['user_id' => $this->bystander->id, 'blocked_user_id' => $this->target->id]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/chat/moderation/blocked-users');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame($this->target->id, $response->json('data.0.blocked_user_id'));
    }

    public function test_check_block_status_is_per_user(): void
    {
        BlockedUser::create(['user_id' => $this->user->id, 'blocked_user_id' => $this->target->id]);

        $this->actingAs($this->user)
            ->getJson("/api/v1/chat/moderation/check-block/{$this->target->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.is_blocked', true);

        // The bystander never blocked the target, so it must report false.
        $this->actingAs($this->bystander)
            ->getJson("/api/v1/chat/moderation/check-block/{$this->target->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.is_blocked', false);
    }

    public function test_user_can_unblock(): void
    {
        BlockedUser::create(['user_id' => $this->user->id, 'blocked_user_id' => $this->target->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/chat/moderation/unblock/{$this->target->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('blocked_users', 0);
    }

    public function test_unblocking_does_not_affect_another_users_block(): void
    {
        BlockedUser::create(['user_id' => $this->bystander->id, 'blocked_user_id' => $this->target->id]);

        // The user never blocked the target, so this is a no-op for them...
        $this->actingAs($this->user)
            ->deleteJson("/api/v1/chat/moderation/unblock/{$this->target->id}")
            ->assertStatus(404);

        // ...and must not clear the bystander's block.
        $this->assertDatabaseHas('blocked_users', [
            'user_id' => $this->bystander->id,
            'blocked_user_id' => $this->target->id,
        ]);
    }

    public function test_user_can_report_another_user(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/chat/moderation/report', [
                'reported_user_id' => $this->target->id,
                'reason' => 'harassment',
                'description' => 'رفتار نامناسب',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('chat_reports', [
            'reporter_id' => $this->user->id,
            'reported_user_id' => $this->target->id,
            'reason' => 'harassment',
        ]);
    }

    public function test_report_rejects_an_invalid_reason(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/chat/moderation/report', [
                'reported_user_id' => $this->target->id,
                'reason' => 'not-a-valid-reason',
            ])
            ->assertStatus(422);

        $this->assertSame(0, ChatReport::count());
    }
}
