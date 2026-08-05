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
                // ستون status اصلاً روی جدول conversations وجود ندارد (فقط
                // is_active هست، که پیش‌فرضش true است) — 'status' => 'active'
                // قبلاً اینجا بود ولی چون در $fillable مدل نیست، Eloquent
                // بی‌صدا نادیده‌اش می‌گرفت.
            ]);
        }

        return $conversation->load(['buyer', 'seller', 'product']);
    }

    /**
     * قبلاً اینجا فقط where('buyer_id', $userId) بود — یعنی وقتی فروشنده‌ای
     * صندوق چت خودش را باز می‌کرد (GET /chat/conversations)، فقط مکالماتی
     * برمی‌گشت که خودِ فروشنده در آن‌ها نقش خریدار داشت، نه مکالمات واقعی
     * مشتریانی که با او چت کرده بودند — یعنی صندوق چت فروشنده تقریباً همیشه
     * خالی یا غلط بود. Conversation::scopeForUser از قبل در مدل تعریف شده
     * بود (buyer_id OR seller_id) ولی هیچ‌جا استفاده نمی‌شد.
     */
    public function getUserConversations(int $userId, string $filter = 'all'): array
    {
        $query = Conversation::forUser($userId)
            ->with(['buyer', 'seller', 'product'])
            ->orderBy('updated_at', 'desc');

        if ($filter === 'active') {
            $query->active();
        }

        return $query->get()->toArray();
    }

    public function getConversation(int $conversationId, int $userId): array
    {
        // همان باگ getUserConversations — فروشنده هیچ‌وقت نمی‌توانست جزئیات
        // مکالمه‌ای را که خودش طرف seller آن بود ببیند.
        $conversation = Conversation::where('id', $conversationId)
            ->forUser($userId)
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
        // همان باگ بالا — قبلاً فروشنده نمی‌توانست مکالمه‌ای را که خودش
        // طرف seller آن بود حذف کند.
        Conversation::where('id', $conversationId)
            ->forUser($userId)
            ->delete();
    }
}
