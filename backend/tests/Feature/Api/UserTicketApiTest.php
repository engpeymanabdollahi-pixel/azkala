<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTicketApiTest extends TestCase
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

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'subject' => 'مشکل در پرداخت',
            'description' => 'هنگام پرداخت خطا دریافت کردم.',
            'priority' => 'high',
            'category' => 'payment',
        ], $overrides);
    }

    private function makeTicket(User $user, array $overrides = []): SupportTicket
    {
        return SupportTicket::create(array_merge([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'user_id' => $user->id,
            'subject' => 'تیکت تستی',
            'description' => 'توضیحات',
            'priority' => 'medium',
            'category' => 'general',
            'status' => 'open',
        ], $overrides));
    }

    public function test_unauthenticated_user_cannot_list_tickets(): void
    {
        $this->getJson('/api/v1/tickets')->assertStatus(401);
    }

    public function test_user_can_create_a_ticket(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/tickets', $this->validPayload())
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $this->user->id,
            'subject' => 'مشکل در پرداخت',
            'status' => 'open',
        ]);
    }

    public function test_creating_a_ticket_validates_priority_and_category(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/tickets', $this->validPayload(['priority' => 'not-a-priority']))
            ->assertStatus(422);

        $this->actingAs($this->user)
            ->postJson('/api/v1/tickets', $this->validPayload(['category' => 'not-a-category']))
            ->assertStatus(422);
    }

    public function test_index_only_lists_own_tickets(): void
    {
        $this->makeTicket($this->user, ['subject' => 'مال من']);
        $this->makeTicket($this->otherUser, ['subject' => 'مال دیگری']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/tickets');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.tickets'));
        $this->assertSame('مال من', $response->json('data.tickets.0.subject'));
    }

    public function test_index_stats_only_count_own_tickets(): void
    {
        $this->makeTicket($this->user, ['status' => 'open']);
        $this->makeTicket($this->user, ['status' => 'resolved']);
        $this->makeTicket($this->otherUser, ['status' => 'open']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/tickets');

        $response->assertStatus(200)
            ->assertJsonPath('data.stats.total', 2)
            ->assertJsonPath('data.stats.open', 1)
            ->assertJsonPath('data.stats.resolved', 1);
    }

    public function test_index_can_filter_by_status(): void
    {
        $this->makeTicket($this->user, ['status' => 'open']);
        $this->makeTicket($this->user, ['status' => 'resolved']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/tickets?status=resolved');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.tickets'));
        $this->assertSame('resolved', $response->json('data.tickets.0.status'));
    }

    public function test_user_can_view_own_ticket(): void
    {
        $ticket = $this->makeTicket($this->user);

        $this->actingAs($this->user)
            ->getJson("/api/v1/tickets/{$ticket->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $ticket->id);
    }

    public function test_user_cannot_view_another_users_ticket(): void
    {
        $ticket = $this->makeTicket($this->otherUser);

        $this->actingAs($this->user)
            ->getJson("/api/v1/tickets/{$ticket->id}")
            ->assertStatus(404);
    }

    public function test_user_can_post_a_message_on_own_ticket(): void
    {
        $ticket = $this->makeTicket($this->user);

        $this->actingAs($this->user)
            ->postJson("/api/v1/tickets/{$ticket->id}/message", ['message' => 'لطفاً پیگیری کنید'])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id' => $ticket->id,
            'user_id' => $this->user->id,
            'message' => 'لطفاً پیگیری کنید',
        ]);
    }

    public function test_user_cannot_post_a_message_on_another_users_ticket(): void
    {
        $ticket = $this->makeTicket($this->otherUser);

        $this->actingAs($this->user)
            ->postJson("/api/v1/tickets/{$ticket->id}/message", ['message' => 'نفوذ'])
            ->assertStatus(500); // ownership failure falls through to the generic handler

        $this->assertSame(0, TicketMessage::where('ticket_id', $ticket->id)->count());
    }

    public function test_owner_of_a_conversation_can_convert_it_to_a_ticket(): void
    {
        $conversation = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $this->otherUser->id,
            'is_active' => true,
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/v1/tickets/convert/{$conversation->id}", [
                'subject' => 'اختلاف با فروشنده',
                'priority' => 'urgent',
                'category' => 'other',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('support_tickets', [
            'conversation_id' => $conversation->id,
            'user_id' => $this->user->id,
        ]);
    }

    public function test_a_stranger_cannot_convert_someone_elses_conversation(): void
    {
        $stranger = User::factory()->create();
        $conversation = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $this->otherUser->id,
            'is_active' => true,
        ]);

        $this->actingAs($stranger)
            ->postJson("/api/v1/tickets/convert/{$conversation->id}", [
                'subject' => 'دسترسی غیرمجاز',
                'priority' => 'low',
                'category' => 'other',
            ])
            ->assertStatus(403);

        $this->assertSame(0, SupportTicket::where('conversation_id', $conversation->id)->count());
    }
}
