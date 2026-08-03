<?php

namespace Tests\Feature\Api;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * NOTE ON ROUTING: these endpoints live under the `admin` middleware group
 * (routes/api.php, inside `Route::prefix('admin')->middleware('admin')`), so
 * only an admin can subscribe a browser for web push. That looks misplaced
 * for a per-user browser-push feature, and nothing in the frontend calls
 * these routes at all today. These tests pin down the behavior as it is
 * currently wired rather than asserting how it arguably should be wired -
 * moving the routes is a product decision, not a refactor.
 */
class PushSubscriptionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $otherAdmin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->otherAdmin = User::factory()->create(['role' => 'admin']);
        $this->customer = User::factory()->create(['role' => 'customer']);
    }

    private function subscriptionPayload(array $overrides = []): array
    {
        return array_merge([
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
            'keys' => [
                'p256dh' => 'BPublicKeyValue',
                'auth' => 'AuthTokenValue',
            ],
        ], $overrides);
    }

    public function test_unauthenticated_user_cannot_subscribe(): void
    {
        $this->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload())
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_subscribe(): void
    {
        $this->actingAs($this->customer)
            ->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload())
            ->assertStatus(403);

        $this->assertSame(0, PushSubscription::count());
    }

    public function test_admin_can_subscribe(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload())
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $this->admin->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
            'is_active' => true,
        ]);
    }

    public function test_subscribe_validates_required_keys(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/subscribe', ['endpoint' => 'https://example.com/x'])
            ->assertStatus(422);
    }

    public function test_resubscribing_the_same_endpoint_updates_instead_of_duplicating(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload())
            ->assertStatus(200);

        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload([
                'keys' => ['p256dh' => 'RotatedPublicKey', 'auth' => 'RotatedAuthToken'],
            ]))
            ->assertStatus(200);

        $this->assertSame(1, PushSubscription::count());
        $this->assertSame('RotatedPublicKey', PushSubscription::first()->public_key);
    }

    public function test_an_endpoint_reclaimed_by_another_admin_is_reassigned(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload())
            ->assertStatus(200);

        // Same browser/endpoint, now used by a different admin account.
        $this->actingAs($this->otherAdmin)
            ->postJson('/api/v1/admin/push/subscribe', $this->subscriptionPayload())
            ->assertStatus(200);

        $this->assertSame(1, PushSubscription::count());
        $this->assertSame($this->otherAdmin->id, PushSubscription::first()->user_id);
    }

    public function test_admin_can_deactivate_own_subscription(): void
    {
        $subscription = PushSubscription::create([
            'user_id' => $this->admin->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/mine',
            'public_key' => 'k',
            'auth_token' => 't',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/push/unsubscribe/{$subscription->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertFalse((bool) $subscription->fresh()->is_active);
    }

    public function test_admin_cannot_deactivate_another_admins_subscription(): void
    {
        $subscription = PushSubscription::create([
            'user_id' => $this->otherAdmin->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/theirs',
            'public_key' => 'k',
            'auth_token' => 't',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/push/unsubscribe/{$subscription->id}")
            ->assertStatus(404);

        // The other admin's subscription must stay active.
        $this->assertTrue((bool) $subscription->fresh()->is_active);
    }

    public function test_send_test_reports_when_there_are_no_active_subscriptions(): void
    {
        // Deliberately no subscription rows: this is the one branch of
        // sendTest that returns before touching the network.
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/test')
            ->assertStatus(200)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'No active subscriptions');
    }

    public function test_send_test_ignores_deactivated_subscriptions(): void
    {
        PushSubscription::create([
            'user_id' => $this->admin->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/inactive',
            'public_key' => 'k',
            'auth_token' => 't',
            'is_active' => false,
        ]);

        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/push/test')
            ->assertStatus(200)
            ->assertJsonPath('success', false);
    }

    public function test_vapid_public_key_is_exposed_to_admins(): void
    {
        config(['webpush.vapid.public_key' => 'test-public-key']);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/push/vapid-public-key')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('publicKey', 'test-public-key');
    }

    public function test_vapid_public_key_is_not_exposed_to_non_admins(): void
    {
        $this->actingAs($this->customer)
            ->getJson('/api/v1/admin/push/vapid-public-key')
            ->assertStatus(403);
    }
}
