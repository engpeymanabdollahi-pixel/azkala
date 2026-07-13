<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Eloquent\Model;

class ChatRepository
{
    public function getOrCreateConversation(int $userId, int $sellerId, ?int $productId = null): Model
    {
        $query = Conversation::where('buyer_id', $userId)->where('seller_id', $sellerId);

        if ($productId) {
            $query->where('product_id', $productId);
        } else {
            $query->whereNull('product_id');
        }

        $conversation = $query->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'buyer_id'   => $userId,
                'seller_id'  => $sellerId,
                'product_id' => $productId,
                'status'     => 'active',
            ]);
        }

        return $conversation->load(['buyer', 'seller', 'product']);
    }

    public function getUserConversations(int $userId, string $filter = 'all'): array
    {
        $query = Conversation::where('buyer_id', $userId)
            ->with(['buyer', 'seller', 'product'])
            ->orderBy('updated_at', 'desc');

        if ($filter === 'active') {
            $query->where('status', 'active');
        }

        return $query->get()->toArray();
    }

    public function getConversation(int $conversationId, int $userId): array
    {
        $conversation = Conversation::where('id', $conversationId)
            ->where('buyer_id', $userId)
            ->with(['buyer', 'seller', 'product'])
            ->firstOrFail();

        return $conversation->toArray();
    }

    public function getMessages(int $conversationId, int $userId, int $perPage = 50): array
    {
        Conversation::where('id', $conversationId)
            ->where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->firstOrFail();

        $messages = Message::where('conversation_id', $conversationId)
            ->with('sender') 
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);

        return $messages->toArray();
    }

    public function sendMessage(int $conversationId, int $userId, string $messageText): array
    {
        $conversation = Conversation::where('id', $conversationId)
            ->where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->firstOrFail();

        // ✅ اصلاح قطعی: استفاده از ستون 'content' به جای 'message'
        $message = Message::create([
            'conversation_id' => $conversationId,
            'sender_id'       => $userId,
            'content'         => $messageText, 
        ]);

        $conversation->update(['updated_at' => now()]);

        return $message->load('sender')->toArray();
    }

    public function deleteConversation(int $conversationId, int $userId): void
    {
        Conversation::where('id', $conversationId)
            ->where('buyer_id', $userId)
            ->delete();
    }
}