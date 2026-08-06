<?php

namespace Tests\Feature\Api;

use App\Models\ChatReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminChatReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $reporter;

    protected User $reportedUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->reporter = User::factory()->create();
        $this->reportedUser = User::factory()->create();
    }

    protected function makeReport(array $overrides = []): ChatReport
    {
        return ChatReport::create(array_merge([
            'reporter_id' => $this->reporter->id,
            'reported_user_id' => $this->reportedUser->id,
            'reason' => 'harassment',
            'description' => 'رفتار نامناسب',
            'status' => 'pending',
        ], $overrides));
    }

    public function test_admin_can_list_reports(): void
    {
        $this->makeReport();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/chat-management/reports');

        $response->assertStatus(200)->assertJsonPath('success', true);
    }

    public function test_admin_can_view_report_details(): void
    {
        $report = $this->makeReport();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/chat-management/reports/{$report->id}");

        $response->assertStatus(200)->assertJsonPath('data.id', $report->id);
    }

    /**
     * ✅ قبلاً اقدام «ارسال هشدار» فقط در لاگ سرور ثبت می‌شد و کاربر گزارش‌شده
     * هیچ نوتیفیکیشن یا اطلاع‌رسانی واقعی دریافت نمی‌کرد.
     */
    public function test_warn_action_sends_a_real_notification_to_the_reported_user(): void
    {
        $report = $this->makeReport();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/reports/{$report->id}/action", [
                'action' => 'warn',
                'reason' => 'لطفاً مؤدبانه صحبت کنید',
            ]);

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->reportedUser->id,
            'type' => 'chat_conduct_warning',
            'message' => 'لطفاً مؤدبانه صحبت کنید',
        ]);
        $this->assertDatabaseHas('chat_reports', [
            'id' => $report->id,
            'status' => 'reviewed',
        ]);
    }

    public function test_block_action_deactivates_the_reported_user(): void
    {
        $report = $this->makeReport();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/reports/{$report->id}/action", [
                'action' => 'block',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $this->reportedUser->id, 'is_active' => false]);
        $this->assertDatabaseHas('chat_reports', ['id' => $report->id, 'status' => 'resolved']);
    }

    public function test_dismiss_action_marks_report_dismissed(): void
    {
        $report = $this->makeReport();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/chat-management/reports/{$report->id}/action", [
                'action' => 'dismiss',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('chat_reports', ['id' => $report->id, 'status' => 'dismissed']);
    }

    public function test_admin_can_get_report_stats(): void
    {
        $this->makeReport(['status' => 'pending']);
        $this->makeReport(['status' => 'resolved']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/chat-management/reports/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.pending', 1)
            ->assertJsonPath('data.resolved', 1);
    }
}
