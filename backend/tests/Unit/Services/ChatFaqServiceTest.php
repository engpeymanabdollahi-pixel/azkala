<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\ChatFaqService;
use App\Models\ChatFaq;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Events\MessageSent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

class ChatFaqServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;
    protected $seller;
    protected $buyer;
    protected $conversation;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new ChatFaqService();
        
        // جلوگیری از broadcast واقعی
        Event::fake();
        
        // ساخت کاربران
        $this->seller = User::factory()->create(['role' => 'seller']);
        $this->buyer = User::factory()->create(['role' => 'customer']);
        
        // ساخت مکالمه
        $this->conversation = Conversation::create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);
    }

    // ==================== processIncomingMessage Tests ====================

    public function test_returns_null_when_message_from_seller(): void
    {
        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->seller->id,
            'content' => 'سلام',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNull($result);
    }

    public function test_returns_null_when_no_matching_faq(): void
    {
        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'یک پیام کاملاً متفاوت',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNull($result);
    }

    public function test_returns_auto_reply_when_faq_matches(): void
    {
        // ساخت FAQ
        ChatFaq::create([
            'seller_id' => $this->seller->id,
            'question_pattern' => 'سلام|درود',
            'answer' => 'سلام! خوش آمدید.',
            'category' => 'general',
            'priority' => 10,
            'is_active' => true,
        ]);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'سلام',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNotNull($result);
        $this->assertInstanceOf(Message::class, $result);
        $this->assertEquals('سلام! خوش آمدید.', $result->content);
        $this->assertEquals($this->seller->id, $result->sender_id);
        $this->assertEquals('system', $result->type);
    }

    public function test_increments_faq_usage_on_match(): void
    {
        $faq = ChatFaq::create([
            'seller_id' => $this->seller->id,
            'question_pattern' => 'قیمت',
            'answer' => 'قیمت در صفحه محصول است.',
            'category' => 'product',
            'priority' => 10,
            'is_active' => true,
            'usage_count' => 0,
        ]);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'قیمت این محصول چقدر است؟',
            'type' => 'text',
        ]);

        $this->service->processIncomingMessage($message, $this->conversation);

        $faq->refresh();
        $this->assertEquals(1, $faq->usage_count);
    }

    public function test_updates_conversation_last_message_at(): void
    {
        ChatFaq::create([
            'seller_id' => $this->seller->id,
            'question_pattern' => 'ارسال',
            'answer' => 'ارسال ۲ تا ۳ روز.',
            'category' => 'shipping',
            'priority' => 10,
            'is_active' => true,
        ]);

        $oldTime = now()->subHour();
        $this->conversation->update(['last_message_at' => $oldTime]);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'زمان ارسال چقدر است؟',
            'type' => 'text',
        ]);

        $this->service->processIncomingMessage($message, $this->conversation);

        $this->conversation->refresh();
        $this->assertGreaterThan($oldTime, $this->conversation->last_message_at);
    }

    public function test_ignores_inactive_faqs(): void
    {
        ChatFaq::create([
            'seller_id' => $this->seller->id,
            'question_pattern' => 'سلام',
            'answer' => 'سلام!',
            'category' => 'general',
            'priority' => 10,
            'is_active' => false, // غیرفعال
        ]);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'سلام',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNull($result);
    }

    public function test_ignores_faqs_from_other_sellers(): void
    {
        $otherSeller = User::factory()->create(['role' => 'seller']);
        
        ChatFaq::create([
            'seller_id' => $otherSeller->id, // فروشنده دیگر
            'question_pattern' => 'سلام',
            'answer' => 'سلام!',
            'category' => 'general',
            'priority' => 10,
            'is_active' => true,
        ]);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'سلام',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNull($result);
    }

    public function test_uses_highest_priority_faq(): void
    {
        ChatFaq::create([
            'seller_id' => $this->seller->id,
            'question_pattern' => 'سلام',
            'answer' => 'پاسخ اول',
            'category' => 'general',
            'priority' => 5,
            'is_active' => true,
        ]);

        ChatFaq::create([
            'seller_id' => $this->seller->id,
            'question_pattern' => 'سلام',
            'answer' => 'پاسخ دوم',
            'category' => 'general',
            'priority' => 15,
            'is_active' => true,
        ]);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'سلام',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNotNull($result);
        $this->assertEquals('پاسخ دوم', $result->content);
    }

    // ==================== seedDefaultFaqs Tests ====================

    public function test_seeds_default_faqs(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $faqs = ChatFaq::where('seller_id', $this->seller->id)->get();

        $this->assertCount(10, $faqs);
    }

    public function test_seeded_faqs_are_active(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $inactiveFaqs = ChatFaq::where('seller_id', $this->seller->id)
            ->where('is_active', false)
            ->count();

        $this->assertEquals(0, $inactiveFaqs);
    }

    public function test_seeded_faqs_have_correct_categories(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $categories = ChatFaq::where('seller_id', $this->seller->id)
            ->distinct()
            ->pluck('category')
            ->toArray();

        $this->assertContains('product', $categories);
        $this->assertContains('shipping', $categories);
        $this->assertContains('general', $categories);
        $this->assertContains('payment', $categories);
    }

    public function test_seeded_faqs_have_patterns(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $faq = ChatFaq::where('seller_id', $this->seller->id)
            ->where('category', 'general')
            ->first();

        $this->assertNotNull($faq);
        $this->assertNotEmpty($faq->question_pattern);
        $this->assertNotEmpty($faq->answer);
    }

    public function test_seeded_faqs_match_greeting(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'سلام',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNotNull($result);
        $this->assertStringContainsString('سلام', $result->content);
    }

    public function test_seeded_faqs_match_price_question(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'قیمت این محصول چقدر است؟',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNotNull($result);
        $this->assertStringContainsString('قیمت', $result->content);
    }

    public function test_seeded_faqs_match_shipping_question(): void
    {
        $this->service->seedDefaultFaqs($this->seller->id);

        $message = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => 'زمان ارسال چقدر است؟',
            'type' => 'text',
        ]);

        $result = $this->service->processIncomingMessage($message, $this->conversation);

        $this->assertNotNull($result);
        $this->assertStringContainsString('ارسال', $result->content);
    }
}