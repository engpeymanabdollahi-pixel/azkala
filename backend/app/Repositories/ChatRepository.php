<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class ChatRepository extends BaseRepository
{
    /**
     * Specify Model class name
     */
    protected function model(): string
    {
        return Conversation::class;
    }

    /**
     * Get user conversations
     */
    public function getUserConversations(int $userId, string $filter = 'all'): Collection
    {
        $query = $this->query()
            ->with([
                'user',
                'seller',
                'lastMessage',
            ])
            ->where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)
                  ->orWhere('seller_id', $userId);
            });

        // Apply filter
        if ($filter === 'unread') {
            $query->where('unread_count', '>', 0);
        }

        return $query->orderByDesc('updated_at')->get();
    }

    /**
     * Get or create conversation between user and seller
     */
    public function getOrCreateConversation(int $userId, int $sellerId, ?int $productId = null): Model
    {
        $conversation = $this->query()
            ->where(function ($q) use ($userId, $sellerId) {
                $q->where('buyer_id', $userId)
                  ->where('seller_id', $sellerId);
            })
            ->first();

        if (!$conversation) {
            $conversation = $this->create([
                'user_id' => $userId,
                'seller_id' => $sellerId,
                'product_id' => $productId,
                'status' => 'active',
            ]);
        }

        return $conversation->load(['user', 'seller', 'product']);
    }

    /**
     * Get messages for a conversation
     */
    public function getMessages(int $conversationId, int $perPage = 50): LengthAwarePaginator
    {
        return Message::where('conversation_id', $conversationId)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    /**
     * Send a message
     */
    public function sendMessage(int $conversationId, int $senderId, string $message): Model
    {
        return Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $senderId,
            'message' => $message,
            'status' => 'sent',
        ]);
    }

    /**
     * Mark messages as read
     */
    public function markAsRead(int $conversationId, int $userId): int
    {
        return Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->where('status', '!=', 'read')
            ->update(['status' => 'read', 'read_at' => now()]);
    }

    /**
     * Get unread count for user
     */
    public function getUnreadCount(int $userId): int
    {
        return Message::whereHas('conversation', function ($q) use ($userId) {
            $q->where('buyer_id', $userId)
              ->orWhere('seller_id', $userId);
        })
        ->where('sender_id', '!=', $userId)
        ->where('status', '!=', 'read')
        ->count();
    }

    /**
     * Delete conversation
     */
    public function deleteConversation(int $conversationId, int $userId): bool
    {
        $conversation = $this->find($conversationId);
        
        if (!$conversation) {
            return false;
        }

        // Check if user is participant
        if ($conversation->user_id !== $userId && $conversation->seller_id !== $userId) {
            return false;
        }

        // Delete all messages
        $conversation->messages()->delete();
        
        // Delete conversation
        return $conversation->delete();
    }
}