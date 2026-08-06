<?php

namespace Tests\Unit\Services;

use App\Models\Conversation;
use App\Models\Message;
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
        $this->repository = new AdminDashboardRepository;
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

    /**
     * ✅ قبلاً avg_response_minutes همیشه عدد ثابت ۵ بود («مقدار پیش‌فرض»
     * طبق کامنت قدیمی)، بدون هیچ ارتباطی با پیام‌های واقعی. این تست میانگین
     * واقعی فاصله‌ی زمانی بین هر پیام و پاسخِ طرف مقابل را می‌سنجد: سه گپ
     * واقعی ۱۰، ۲۰ و ۲۰ دقیقه‌ای → میانگین (۱۰+۲۰+۲۰)/۳ = ۱۶.۷.
     */
    public function test_chat_stats_computes_real_average_response_time(): void
    {
        $buyer = User::factory()->create(['role' => 'customer']);
        $seller = User::factory()->create(['role' => 'seller']);
        $conversation = Conversation::factory()->create(['buyer_id' => $buyer->id, 'seller_id' => $seller->id]);

        $base = now()->subDay();
        Message::factory()->create(['conversation_id' => $conversation->id, 'sender_id' => $buyer->id, 'created_at' => $base]);
        Message::factory()->create(['conversation_id' => $conversation->id, 'sender_id' => $seller->id, 'created_at' => $base->copy()->addMinutes(10)]);
        Message::factory()->create(['conversation_id' => $conversation->id, 'sender_id' => $buyer->id, 'created_at' => $base->copy()->addMinutes(30)]);
        Message::factory()->create(['conversation_id' => $conversation->id, 'sender_id' => $seller->id, 'created_at' => $base->copy()->addMinutes(50)]);

        $stats = $this->service->getChatStats();

        $this->assertSame(16.7, $stats['avg_response_minutes']);
    }

    /**
     * پیام‌های پشت‌سرهمِ خودِ یک نفر (بدون پاسخ طرف مقابل) نباید در میانگین
     * زمان پاسخ حساب شوند.
     */
    public function test_average_response_time_ignores_consecutive_messages_from_the_same_sender(): void
    {
        $buyer = User::factory()->create(['role' => 'customer']);
        $seller = User::factory()->create(['role' => 'seller']);
        $conversation = Conversation::factory()->create(['buyer_id' => $buyer->id, 'seller_id' => $seller->id]);

        $base = now()->subDay();
        Message::factory()->create(['conversation_id' => $conversation->id, 'sender_id' => $buyer->id, 'created_at' => $base]);
        Message::factory()->create(['conversation_id' => $conversation->id, 'sender_id' => $buyer->id, 'created_at' => $base->copy()->addMinutes(5)]);

        $stats = $this->service->getChatStats();

        $this->assertSame(0.0, $stats['avg_response_minutes']);
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
        // ✅ قبلاً busiest_hour حتی بدون هیچ پیامی رشته‌ی ثابت «۱۴:۰۰ - ۱۶:۰۰»
        // بود؛ حالا وقتی داده‌ای نیست باید صریحاً به همین موضوع اشاره کند.
        $this->assertSame('داده‌ای موجود نیست', $activity['busiest_hour']);
    }

    /**
     * ✅ قبلاً busiest_hour همیشه رشته‌ی ثابت «۱۴:۰۰ - ۱۶:۰۰» بود («مقدار
     * ثابت» طبق کامنت قدیمی). این تست تایید می‌کند که ساعتِ واقعاً پرتکرار
     * پیام‌ها (۱۰ صبح) محاسبه و برگردانده می‌شود، نه رشته‌ی ثابت قدیمی.
     */
    public function test_recent_chat_activity_computes_the_real_busiest_hour(): void
    {
        $sender = User::factory()->create();
        $conversation = Conversation::factory()->create();

        $today = now()->subDay()->startOfDay();
        // سه پیام ساعت ۱۰ صبح (پرتکرارترین) + یک پیام ساعت ۳ بامداد
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'created_at' => $today->copy()->setTime(10, 0),
        ]);
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'created_at' => $today->copy()->setTime(3, 0),
        ]);

        $activity = $this->service->getRecentChatActivity();

        $this->assertSame('10:00 - 11:00', $activity['busiest_hour']);
    }
}
