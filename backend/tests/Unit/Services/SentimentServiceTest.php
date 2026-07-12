<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\SentimentService;
use App\Models\MessageSentiment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SentimentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;
    protected $user;
    protected $seller;
    protected $conversation;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new SentimentService();
        
        $this->user = User::factory()->create(['role' => 'customer']);
        $this->seller = User::factory()->create(['role' => 'seller']);
        
        $this->conversation = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);
    }

    // Helper برای ساخت پیام
    protected function createMessage(string $content = 'test'): Message
    {
        return Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->user->id,
            'content' => $content,
            'type' => 'text',
        ]);
    }

    // ==================== analyze Tests ====================

    public function test_can_analyze_positive_message(): void
    {
        $message = $this->createMessage('عالی بود خیلی ممنون از شما');
        
        $result = $this->service->analyze(
            'عالی بود خیلی ممنون از شما',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertInstanceOf(MessageSentiment::class, $result);
        $this->assertEquals('positive', $result->sentiment);
        $this->assertGreaterThan(0, $result->score);
    }

    public function test_can_analyze_negative_message(): void
    {
        $message = $this->createMessage('خیلی بد بود اصلا راضی نیستم');
        
        $result = $this->service->analyze(
            'خیلی بد بود اصلا راضی نیستم',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertInstanceOf(MessageSentiment::class, $result);
        $this->assertEquals('negative', $result->sentiment);
        $this->assertLessThan(0, $result->score);
    }

    public function test_can_analyze_neutral_message(): void
    {
        $message = $this->createMessage('سلام');
        
        $result = $this->service->analyze(
            'سلام',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertInstanceOf(MessageSentiment::class, $result);
        $this->assertEquals('neutral', $result->sentiment);
    }

    public function test_analyze_with_intensifier(): void
    {
        $message1 = $this->createMessage('خیلی عالی بود');
        $resultWithIntensifier = $this->service->analyze(
            'خیلی عالی بود',
            $message1->id,
            $this->conversation->id,
            $this->user->id
        );

        $message2 = $this->createMessage('عالی بود');
        $resultWithoutIntensifier = $this->service->analyze(
            'عالی بود',
            $message2->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertGreaterThan($resultWithoutIntensifier->score, $resultWithIntensifier->score);
    }

    public function test_analyze_with_diminisher(): void
    {
        $message1 = $this->createMessage('کمی خوب بود');
        $resultWithDiminisher = $this->service->analyze(
            'کمی خوب بود',
            $message1->id,
            $this->conversation->id,
            $this->user->id
        );

        $message2 = $this->createMessage('خوب بود');
        $resultWithoutDiminisher = $this->service->analyze(
            'خوب بود',
            $message2->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertLessThan($resultWithoutDiminisher->score, $resultWithDiminisher->score);
    }

    public function test_analyze_with_multiple_exclamation(): void
    {
        $message = $this->createMessage('عالی بود!!!');
        
        $result = $this->service->analyze(
            'عالی بود!!!',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertGreaterThan(0, $result->score);
        $this->assertEquals('positive', $result->sentiment);
    }

    public function test_analyze_creates_sentiment_record(): void
    {
        $message = $this->createMessage('خوب بود');
        
        $this->assertDatabaseMissing('message_sentiments', [
            'message_id' => $message->id,
        ]);

        $this->service->analyze(
            'خوب بود',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertDatabaseHas('message_sentiments', [
            'message_id' => $message->id,
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
        ]);
    }

    public function test_analyze_updates_existing_sentiment(): void
    {
        $message = $this->createMessage('خوب بود');
        
        MessageSentiment::create([
            'message_id' => $message->id,
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
            'sentiment' => 'neutral',
            'score' => 0.0,
            'keywords' => [],
        ]);

        $result = $this->service->analyze(
            'عالی بود',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertEquals('positive', $result->sentiment);
        $this->assertEquals(1, MessageSentiment::where('message_id', $message->id)->count());
    }

    public function test_analyze_stores_keywords(): void
    {
        $message = $this->createMessage('عالی بود ممنون');
        
        $result = $this->service->analyze(
            'عالی بود ممنون',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertIsArray($result->keywords);
        $this->assertNotEmpty($result->keywords);
    }

    public function test_analyze_score_is_normalized(): void
    {
        $message = $this->createMessage('خیلی خیلی عالی بود فوق العاده ممنون');
        
        $result = $this->service->analyze(
            'خیلی خیلی عالی بود فوق العاده ممنون',
            $message->id,
            $this->conversation->id,
            $this->user->id
        );

        $this->assertGreaterThanOrEqual(-1.0, $result->score);
        $this->assertLessThanOrEqual(1.0, $result->score);
    }

    // ==================== getConversationStats Tests ====================

    public function test_can_get_conversation_stats(): void
    {
        // ساخت ۱۰ پیام و sentiment
        for ($i = 0; $i < 10; $i++) {
            $message = $this->createMessage("Message $i");
            
            MessageSentiment::create([
                'message_id' => $message->id,
                'conversation_id' => $this->conversation->id,
                'user_id' => $this->user->id,
                'sentiment' => $i < 5 ? 'positive' : ($i < 8 ? 'negative' : 'neutral'),
                'score' => $i < 5 ? 0.5 : ($i < 8 ? -0.5 : 0.0),
                'keywords' => [],
            ]);
        }

        $stats = $this->service->getConversationStats($this->conversation->id);

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total', $stats);
        $this->assertArrayHasKey('positive', $stats);
        $this->assertArrayHasKey('negative', $stats);
        $this->assertArrayHasKey('neutral', $stats);
        $this->assertArrayHasKey('positive_percent', $stats);
        $this->assertArrayHasKey('negative_percent', $stats);
        $this->assertArrayHasKey('neutral_percent', $stats);
        $this->assertArrayHasKey('average_score', $stats);
        $this->assertArrayHasKey('overall_sentiment', $stats);

        $this->assertEquals(10, $stats['total']);
        $this->assertEquals(5, $stats['positive']);
        $this->assertEquals(3, $stats['negative']);
        $this->assertEquals(2, $stats['neutral']);
    }

    public function test_get_conversation_stats_with_no_data(): void
    {
        $stats = $this->service->getConversationStats($this->conversation->id);

        $this->assertEquals(0, $stats['total']);
        $this->assertEquals(0, $stats['positive']);
        $this->assertEquals(0, $stats['negative']);
        $this->assertEquals(0, $stats['neutral']);
        $this->assertEquals(0, $stats['positive_percent']);
        $this->assertEquals(0, $stats['negative_percent']);
        $this->assertEquals(0, $stats['neutral_percent']);
        $this->assertEquals(0.0, $stats['average_score']);
    }

    public function test_get_conversation_stats_calculates_percentages(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $message = $this->createMessage("Positive $i");
            
            MessageSentiment::create([
                'message_id' => $message->id,
                'conversation_id' => $this->conversation->id,
                'user_id' => $this->user->id,
                'sentiment' => 'positive',
                'score' => 0.5,
                'keywords' => [],
            ]);
        }

        $message = $this->createMessage('Negative');
        MessageSentiment::create([
            'message_id' => $message->id,
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
            'sentiment' => 'negative',
            'score' => -0.5,
            'keywords' => [],
        ]);

        $stats = $this->service->getConversationStats($this->conversation->id);

        $this->assertEquals(80.0, $stats['positive_percent']);
        $this->assertEquals(20.0, $stats['negative_percent']);
        $this->assertEquals(0.0, $stats['neutral_percent']);
    }

    public function test_get_conversation_stats_determines_overall_sentiment(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $message = $this->createMessage("Positive $i");
            
            MessageSentiment::create([
                'message_id' => $message->id,
                'conversation_id' => $this->conversation->id,
                'user_id' => $this->user->id,
                'sentiment' => 'positive',
                'score' => 0.8,
                'keywords' => [],
            ]);
        }

        $stats = $this->service->getConversationStats($this->conversation->id);

        $this->assertEquals('positive', $stats['overall_sentiment']);
    }

    public function test_get_conversation_stats_only_counts_specific_conversation(): void
    {
        $otherConversation = Conversation::create([
            'buyer_id' => $this->user->id,
            'seller_id' => $this->seller->id,
            'last_message_at' => now(),
        ]);

        $message1 = $this->createMessage('Positive');
        MessageSentiment::create([
            'message_id' => $message1->id,
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
            'sentiment' => 'positive',
            'score' => 0.5,
            'keywords' => [],
        ]);

        $message2 = Message::create([
            'conversation_id' => $otherConversation->id,
            'sender_id' => $this->user->id,
            'content' => 'Negative',
            'type' => 'text',
        ]);
        
        MessageSentiment::create([
            'message_id' => $message2->id,
            'conversation_id' => $otherConversation->id,
            'user_id' => $this->user->id,
            'sentiment' => 'negative',
            'score' => -0.5,
            'keywords' => [],
        ]);

        $stats = $this->service->getConversationStats($this->conversation->id);

        $this->assertEquals(1, $stats['total']);
        $this->assertEquals(1, $stats['positive']);
        $this->assertEquals(0, $stats['negative']);
    }
}