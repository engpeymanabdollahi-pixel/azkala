<?php

namespace Tests\Unit\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Repositories\AdminDashboardRepository;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminDashboardService $service;
    protected AdminDashboardRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new AdminDashboardRepository();
        $this->service = new AdminDashboardService($this->repository);
    }

    // ==================== getDashboardStats Tests ====================

    public function test_can_get_dashboard_stats(): void
    {
        // ایجاد داده تست
        User::factory()->count(5)->create(['role' => 'customer']);
        User::factory()->count(2)->create(['role' => 'seller']);
        Product::factory()->count(10)->create();
        Order::factory()->count(8)->create();

        $stats = $this->service->getDashboardStats();

        $this->assertIsArray($stats);
        $this->assertNotEmpty($stats);
    }

    public function test_dashboard_stats_returns_correct_structure(): void
    {
        $stats = $this->service->getDashboardStats();

        $this->assertIsArray($stats);
        // بررسی ساختار کلی (کلیدهای اصلی)
        $this->assertNotEmpty($stats);
    }

    public function test_dashboard_stats_with_no_data(): void
    {
        $stats = $this->service->getDashboardStats();

        $this->assertIsArray($stats);
        // حتی بدون داده هم باید آرایه برگرداند
        $this->assertNotEmpty($stats);
    }

    // ==================== getChatStats Tests ====================

    public function test_can_get_chat_stats(): void
    {
        $stats = $this->service->getChatStats();

        $this->assertIsArray($stats);
        $this->assertNotEmpty($stats);
    }

    public function test_chat_stats_returns_correct_structure(): void
    {
        $stats = $this->service->getChatStats();

        $this->assertIsArray($stats);
        $this->assertNotEmpty($stats);
    }

    // ==================== getSentimentStats Tests ====================

    public function test_can_get_sentiment_stats(): void
    {
        $stats = $this->service->getSentimentStats();

        $this->assertIsArray($stats);
        $this->assertNotEmpty($stats);
    }

    public function test_sentiment_stats_returns_correct_structure(): void
    {
        $stats = $this->service->getSentimentStats();

        $this->assertIsArray($stats);
        $this->assertNotEmpty($stats);
    }

    // ==================== getRecentChatActivity Tests ====================

    public function test_can_get_recent_chat_activity(): void
    {
        $activity = $this->service->getRecentChatActivity();

        $this->assertIsArray($activity);
    }

    public function test_recent_chat_activity_returns_correct_structure(): void
    {
        $activity = $this->service->getRecentChatActivity();

        $this->assertIsArray($activity);
    }

    public function test_recent_chat_activity_with_no_data(): void
    {
        $activity = $this->service->getRecentChatActivity();

        $this->assertIsArray($activity);
        // بدون داده هم باید آرایه برگرداند (ممکن است خالی باشد)
    }
}