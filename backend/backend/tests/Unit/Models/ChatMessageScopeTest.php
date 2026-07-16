<?php

namespace Tests\Unit\Models;

use App\Models\User;
use App\Models\ChatRoom;
use App\Models\ChatMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatMessageScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_only_see_messages_in_their_rooms(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create(); // کاربر سوم غریبه

        // اتاق بین user1 و user2
        $room = ChatRoom::create();
        $room->users()->attach([$user1->id, $user2->id]);

        $message1 = ChatMessage::create(['room_id' => $room->id, 'user_id' => $user1->id, 'body' => 'Hello']);
        $message2 = ChatMessage::create(['room_id' => $room->id, 'user_id' => $user2->id, 'body' => 'Hi']);

        // کاربر سوم نباید هیچ پیامی ببیند
        $user3Messages = ChatMessage::forUser($user3)->get();
        $this->assertCount(0, $user3Messages);

        // کاربر اول باید هر دو پیام را ببیند
        $user1Messages = ChatMessage::forUser($user1)->get();
        $this->assertCount(2, $user1Messages);
    }

    public function test_unread_count_is_accurate(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $room = ChatRoom::create();
        $room->users()->attach([$user1->id, $user2->id]);

        ChatMessage::create(['room_id' => $room->id, 'user_id' => $user1->id, 'body' => 'Msg 1', 'read_at' => now()]);
        ChatMessage::create(['room_id' => $room->id, 'user_id' => $user2->id, 'body' => 'Msg 2', 'read_at' => null]);
        ChatMessage::create(['room_id' => $room->id, 'user_id' => $user2->id, 'body' => 'Msg 3', 'read_at' => null]);

        // کاربر 1 باید 2 پیام خوانده نشده داشته باشد
        $unreadCount = ChatMessage::forUser($user1)->unread()->count();
        $this->assertEquals(2, $unreadCount);
    }
}