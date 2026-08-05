<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GET /chat/conversations — همان endpointای که هم مشتری و هم فروشنده
 * (SellerChatPage.tsx) صندوق چت خودشان را از آن می‌خوانند.
 *
 * ChatRepository::getUserConversations قبلاً فقط where('buyer_id', $userId)
 * می‌زد — یعنی وقتی فروشنده‌ای صندوق چت خودش را باز می‌کرد، فقط مکالماتی
 * برمی‌گشت که خودِ او در آن‌ها نقش خریدار داشت، نه مکالمات واقعیِ مشتریانی
 * که با او (به‌عنوان seller_id) چت کرده بودند. صندوق چت فروشنده عملاً همیشه
 * خالی یا غلط بود. Conversation::scopeForUser (buyer_id OR seller_id) از
 * قبل در مدل تعریف شده بود ولی هیچ‌جا استفاده نمی‌شد.
 */
class SellerChatConversationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_sees_conversations_where_they_are_the_seller(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer']);

        $conversation = Conversation::factory()->create([
            'buyer_id' => $customer->id,
            'seller_id' => $seller->id,
        ]);

        $response = $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/chat/conversations');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($conversation->id), 'فروشنده باید مکالماتی را که در آن‌ها seller است ببیند.');
    }

    public function test_seller_can_open_a_conversation_where_they_are_the_seller(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer']);

        $conversation = Conversation::factory()->create([
            'buyer_id' => $customer->id,
            'seller_id' => $seller->id,
        ]);

        $this->actingAs($seller, 'sanctum')
            ->getJson("/api/v1/chat/conversations/{$conversation->id}")
            ->assertOk();
    }

    public function test_seller_can_delete_a_conversation_where_they_are_the_seller(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer']);

        $conversation = Conversation::factory()->create([
            'buyer_id' => $customer->id,
            'seller_id' => $seller->id,
        ]);

        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/v1/chat/conversations/{$conversation->id}")
            ->assertOk();

        $this->assertDatabaseMissing('conversations', ['id' => $conversation->id]);
    }

    public function test_a_third_party_seller_does_not_see_someone_elses_conversation(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $otherSeller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer']);

        Conversation::factory()->create([
            'buyer_id' => $customer->id,
            'seller_id' => $otherSeller->id,
        ]);

        $response = $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/chat/conversations')
            ->assertOk();

        $this->assertCount(0, $response->json('data'));
    }
}
