<?php

namespace Tests\Unit\Services;

use App\DTOs\Chat\SendMessageDTO;
use App\Models\User;
use App\Repositories\ChatRepository;
use App\Services\Chat\ChatService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ChatServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ChatService $service;
    protected $mockRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockRepository = Mockery::mock(ChatRepository::class);
        $this->service = new ChatService($this->mockRepository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // ==================== getUserConversations Tests ====================

    public function test_can_get_user_conversations(): void
    {
        $userId = 1;
        
        // استفاده از Eloquent Collection
        $conversations = new Collection([]);

        $this->mockRepository
            ->shouldReceive('getUserConversations')
            ->with($userId, 'all')
            ->once()
            ->andReturn($conversations);

        $result = $this->service->getUserConversations($userId);

        $this->assertIsArray($result);
        $this->assertCount(0, $result);
    }

    public function test_can_get_user_conversations_with_filter(): void
    {
        $userId = 1;
        $conversations = new Collection([]);

        $this->mockRepository
            ->shouldReceive('getUserConversations')
            ->with($userId, 'unread')
            ->once()
            ->andReturn($conversations);

        $result = $this->service->getUserConversations($userId, 'unread');

        $this->assertIsArray($result);
    }

    // ==================== sendMessage Validation Tests ====================

    public function test_cannot_send_empty_message(): void
    {
        $dto = new SendMessageDTO(
            conversation_id: 1,
            sender_id: 1,
            message: ''
        );

        $this->expectException(\Exception::class);

        $this->service->sendMessage($dto);
    }

    public function test_cannot_send_message_exceeding_max_length(): void
    {
        $dto = new SendMessageDTO(
            conversation_id: 1,
            sender_id: 1,
            message: str_repeat('a', 2001)
        );

        $this->expectException(\Exception::class);

        $this->service->sendMessage($dto);
    }

    // ==================== getUnreadCount Tests ====================

    public function test_can_get_unread_count(): void
    {
        $userId = 1;

        $this->mockRepository
            ->shouldReceive('getUnreadCount')
            ->with($userId)
            ->once()
            ->andReturn(5);

        $count = $this->service->getUnreadCount($userId);

        $this->assertIsInt($count);
        $this->assertEquals(5, $count);
    }

    public function test_unread_count_returns_zero_when_no_unread(): void
    {
        $userId = 1;

        $this->mockRepository
            ->shouldReceive('getUnreadCount')
            ->with($userId)
            ->once()
            ->andReturn(0);

        $count = $this->service->getUnreadCount($userId);

        $this->assertEquals(0, $count);
    }

    // ==================== getOnlineStatus Tests ====================

    public function test_can_get_online_status(): void
    {
        $users = User::factory()->count(3)->create();
        $userIds = $users->pluck('id')->toArray();

        $result = $this->service->getOnlineStatus($userIds);

        $this->assertIsArray($result);
        $this->assertCount(3, $result);
    }

    public function test_online_status_returns_correct_structure(): void
    {
        $user = User::factory()->create(['last_seen_at' => now()]);

        $result = $this->service->getOnlineStatus([$user->id]);

        $this->assertArrayHasKey($user->id, $result);
        $this->assertArrayHasKey('is_online', $result[$user->id]);
        $this->assertArrayHasKey('last_seen_at', $result[$user->id]);
        $this->assertArrayHasKey('status', $result[$user->id]);
    }

    public function test_user_is_online_if_seen_recently(): void
    {
        $user = User::factory()->create(['last_seen_at' => now()->subMinutes(2)]);

        $result = $this->service->getOnlineStatus([$user->id]);

        $this->assertTrue($result[$user->id]['is_online']);
        $this->assertEquals('online', $result[$user->id]['status']);
    }

    public function test_user_is_offline_if_not_seen_recently(): void
    {
        $user = User::factory()->create(['last_seen_at' => now()->subMinutes(10)]);

        $result = $this->service->getOnlineStatus([$user->id]);

        $this->assertFalse($result[$user->id]['is_online']);
        $this->assertEquals('offline', $result[$user->id]['status']);
    }
}