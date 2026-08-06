<?php

namespace Tests\Feature\Api;

use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSupportTicketApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->customer = User::factory()->create(['role' => 'buyer']);
    }

    protected function makeTicket(array $overrides = []): SupportTicket
    {
        return SupportTicket::create(array_merge([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'user_id' => $this->customer->id,
            'subject' => 'مشکل در پرداخت',
            'description' => 'مبلغ کسر شد ولی سفارش ثبت نشد',
            'priority' => 'high',
            'category' => 'payment',
            'status' => 'open',
        ], $overrides));
    }

    /**
     * ✅ قبلاً فرانت‌اند با «ticketsData?.data || []» مقدار تیکت‌ها را
     * می‌خواند، در حالی که پاسخ واقعی بکند «data.tickets» است (به‌همراه
     * data.pagination و data.stats) — یعنی به‌محض وجود حتی یک تیکت، کل
     * تب پشتیبانی با TypeError: tickets.map is not a function کرش می‌کرد.
     */
    public function test_admin_can_list_tickets_with_the_correct_response_shape(): void
    {
        $this->makeTicket();
        $this->makeTicket(['status' => 'resolved', 'priority' => 'urgent']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/chat-management/tickets');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.tickets')
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonPath('data.stats.total', 2)
            ->assertJsonPath('data.stats.urgent', 1);
    }

    /**
     * ✅ role اضافه شد — قبلاً فرانت‌اند برای تشخیص «پیام ادمین» به فیلد
     * ناموجود is_admin تکیه می‌کرد که هرگز در پاسخ API وجود نداشت، پس همهٔ
     * پیام‌ها (چه از پشتیبانی، چه از کاربر) یکسان نمایش داده می‌شدند.
     */
    public function test_ticket_detail_includes_message_sender_role(): void
    {
        $ticket = $this->makeTicket();
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $this->admin->id,
            'message' => 'در حال بررسی مشکل شما هستیم',
        ]);
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $this->customer->id,
            'message' => 'ممنون، منتظرم',
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/chat-management/tickets/{$ticket->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.messages.0.user.role', 'admin')
            ->assertJsonPath('data.messages.1.user.role', 'buyer');
    }

    /**
     * ارسال پیام باید تیکت باز را به‌طور خودکار به in_progress تغییر دهد
     * و پیام برگشتی باید role کاربر فرستنده را همراه داشته باشد.
     */
    public function test_admin_reply_moves_open_ticket_to_in_progress_and_returns_sender_role(): void
    {
        $ticket = $this->makeTicket(['status' => 'open']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/tickets/{$ticket->id}/message", [
                'message' => 'سلام، پیگیری می‌کنیم',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'admin');

        $this->assertSame('in_progress', $ticket->fresh()->status);
    }

    public function test_admin_can_update_ticket_status_to_resolved(): void
    {
        $ticket = $this->makeTicket(['status' => 'in_progress']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/chat-management/tickets/{$ticket->id}", [
                'status' => 'resolved',
                'resolution_notes' => 'مشکل برطرف شد',
            ]);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $ticket->refresh();
        $this->assertSame('resolved', $ticket->status);
        $this->assertSame('مشکل برطرف شد', $ticket->resolution_notes);
        $this->assertNotNull($ticket->resolved_at);
    }

    public function test_admin_can_assign_a_ticket_to_support_staff(): void
    {
        $ticket = $this->makeTicket();
        $agent = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/tickets/{$ticket->id}/assign", [
                'assigned_to' => $agent->id,
            ]);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $ticket->refresh();
        $this->assertSame($agent->id, $ticket->assigned_to);
        $this->assertSame('in_progress', $ticket->status);
    }
}
