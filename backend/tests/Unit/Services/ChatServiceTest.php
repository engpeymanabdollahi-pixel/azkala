<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\Chat\ChatService;
use App\Repositories\ChatRepository;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class ChatServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $chatRepository;
    protected $chatService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->chatRepository = Mockery::mock(ChatRepository::class);
        $this->app->instance(ChatRepository::class, $this->chatRepository);
        $this->chatService = app(ChatService::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function test_can_get_user_conversations()
    {
        $userId = 1;
        $expected = [['id' => 1, 'seller_id' => 2]];

        $this->chatRepository
            ->shouldReceive('getUserConversations')
            ->with($userId, 'all')
            ->once()
            ->andReturn($expected);

        $result = $this->chatService->getUserConversations($userId);
        $this->assertEquals($expected, $result);
    }

    /** @test */
    public function test_can_get_user_conversations_with_filter()
    {
        $userId = 1;
        $expected = [['id' => 1, 'seller_id' => 2]];

        $this->chatRepository
            ->shouldReceive('getUserConversations')
            ->with($userId, 'active')
            ->once()
            ->andReturn($expected);

        $result = $this->chatService->getUserConversations($userId, 'active');
        $this->assertEquals($expected, $result);
    }

    /** @test */
    public function test_can_send_message()
    {
        $conversationId = 1;
        $userId = 1;
        $messageText = 'Hello';
        $expected = ['id' => 1, 'content' => 'Hello'];

        $this->chatRepository
            ->shouldReceive('sendMessage')
            ->with($conversationId, $userId, $messageText)
            ->once()
            ->andReturn($expected);

        $result = $this->chatService->sendMessage($conversationId, $userId, $messageText);
        $this->assertEquals($expected, $result);
    }

    /** @test */
    public function test_can_start_conversation()
    {
        $userId = 1;
        $sellerId = 2;
        $productId = null;
        
        $conversation = Mockery::mock(Conversation::class);
        $conversation->shouldReceive('getAttribute')->with('id')->andReturn(1);
        $conversation->shouldReceive('getAttribute')->with('buyer_id')->andReturn($userId);
        $conversation->shouldReceive('getAttribute')->with('seller_id')->andReturn($sellerId);
        $conversation->shouldReceive('getAttribute')->with('product_id')->andReturn($productId);
        $conversation->shouldReceive('getAttribute')->with('status')->andReturn('active');
        
        $buyer = Mockery::mock(User::class);
        $buyer->shouldReceive('getAttribute')->with('id')->andReturn($userId);
        
        $seller = Mockery::mock(User::class);
        $seller->shouldReceive('getAttribute')->with('id')->andReturn($sellerId);
        
        $conversation->shouldReceive('getAttribute')->with('buyer')->andReturn($buyer);
        $conversation->shouldReceive('getAttribute')->with('seller')->andReturn($seller);

        $this->chatRepository
            ->shouldReceive('getOrCreateConversation')
            ->with($userId, $sellerId, $productId)
            ->once()
            ->andReturn($conversation);

        $result = $this->chatService->startConversation($userId, $sellerId, $productId);
        $this->assertIsArray($result);
        $this->assertEquals(1, $result['id']);
    }

    /** @test */
    public function test_can_get_messages()
    {
        $conversationId = 1;
        $userId = 1;
        $perPage = 50;
        $expected = ['data' => [['id' => 1, 'content' => 'Hello']]];

        $this->chatRepository
            ->shouldReceive('getMessages')
            ->with($conversationId, $userId, $perPage)
            ->once()
            ->andReturn($expected);

        $result = $this->chatService->getMessages($conversationId, $userId, $perPage);
        $this->assertEquals($expected, $result);
    }

    /** @test */
    public function test_can_delete_conversation()
    {
        $conversationId = 1;
        $userId = 1;

        $this->chatRepository
            ->shouldReceive('deleteConversation')
            ->with($conversationId, $userId)
            ->once();

        $this->chatService->deleteConversation($conversationId, $userId);
        $this->assertTrue(true);
    }
}