<?php

namespace Tests\Feature\Api;

use App\Models\ChatReport;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً پکیج‌های maatwebsite/excel و barryvdh/laravel-dompdf اصلاً در
 * composer.json نصب نشده بودند — یعنی هر یک از این ۸ endpoint خروجی با
 * خطای «Class not found» کرش می‌کرد. حتی بعد از نصب پکیج‌ها، متدهای Excel
 * از «new \Maatwebsite\Excel\Sheet($data)» استفاده می‌کردند که سازنده‌اش
 * PhpOffice\PhpSpreadsheet\Worksheet\Worksheet می‌خواهد نه آرایه، پس با
 * TypeError کرش می‌کرد. ضمن اینکه دکمه‌های خروجی برای بیشتر این انواع
 * (products/chat/reports/summary) در هیچ صفحه‌ای رندر نمی‌شدند.
 */
class ReportExportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_export_orders_to_excel(): void
    {
        Order::factory()->create();

        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/orders/excel');

        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_orders_to_pdf(): void
    {
        Order::factory()->create();

        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/orders/pdf');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_users_to_excel(): void
    {
        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/users/excel');

        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_users_to_pdf(): void
    {
        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/users/pdf');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_products_to_excel(): void
    {
        Product::factory()->create();

        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/products/excel');

        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_chat_conversations_to_excel(): void
    {
        Conversation::factory()->create();

        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/chat/excel');

        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_chat_reports_to_excel(): void
    {
        $reporter = User::factory()->create();
        $reported = User::factory()->create();
        ChatReport::create([
            'reporter_id' => $reporter->id,
            'reported_user_id' => $reported->id,
            'reason' => 'harassment',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/reports/excel');

        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_admin_can_export_summary_to_pdf(): void
    {
        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/summary/pdf?period=30');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
    }

    /**
     * خروجی باید حتی وقتی هیچ ردیفی وجود ندارد (آرایه خالی) کرش نکند —
     * ArrayExport باید headings را از اولین ردیف استخراج کند و برای آرایه
     * خالی باید یک ستون خالی سالم برگرداند، نه Exception.
     */
    public function test_export_does_not_crash_when_there_is_no_data(): void
    {
        $response = $this->actingAs($this->admin)->get('/api/v1/admin/export/orders/excel');

        $response->assertStatus(200);
    }
}
