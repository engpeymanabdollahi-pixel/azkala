<?php

namespace App\Services\Chat;

use App\Models\User;
use App\Repositories\ChatRepository;

class ChatService
{
    protected ChatRepository $chatRepository;

    public function __construct(ChatRepository $chatRepository)
    {
        $this->chatRepository = $chatRepository;
    }

    public function startConversation(int $userId, int $sellerId, ?int $productId = null): array
    {
        $conversation = $this->chatRepository->getOrCreateConversation($userId, $sellerId, $productId);

        return [
            'id' => $conversation->id,
            'buyer_id' => $conversation->buyer_id,
            'seller_id' => $conversation->seller_id,
            'product_id' => $conversation->product_id,
            'status' => $conversation->status,
            'buyer' => [
                'id' => $conversation->buyer->id,
                'name' => $conversation->buyer->name,
            ],
            'seller' => [
                'id' => $conversation->seller->id,
                'name' => $conversation->seller->name,
            ],
        ];
    }

    public function getUserConversations(int $userId, string $filter = 'all'): array
    {
        return $this->chatRepository->getUserConversations($userId, $filter);
    }

    public function getConversation(int $conversationId, int $userId): array
    {
        return $this->chatRepository->getConversation($conversationId, $userId);
    }

    public function getMessages(int $conversationId, int $userId, int $perPage = 50): array
    {
        return $this->chatRepository->getMessages($conversationId, $userId, $perPage);
    }

    public function sendMessage(int $conversationId, int $userId, string $messageText): array
    {
        return $this->chatRepository->sendMessage($conversationId, $userId, $messageText);
    }

    public function deleteConversation(int $conversationId, int $userId): void
    {
        $this->chatRepository->deleteConversation($conversationId, $userId);
    }

    /**
     * وضعیت آنلاین/آخرین بازدید یک گروه از کاربران، بر اساس last_seen_at
     * که UpdateLastSeen middleware به‌روز نگه می‌دارد.
     *
     * ✅ قبلاً روت POST /chat/online-status به این متد اشاره می‌کرد اما
     * اصلاً پیاده‌سازی نشده بود؛ ChatWidget و SellerChatPage هر چند
     * ثانیه یک‌بار این endpoint را صدا می‌زدند و هر بار با
     * BadMethodCallException و ۵۰۰ مواجه می‌شدند.
     *
     * @param  int[]  $userIds
     * @return array<int, array{id:int,name:string,is_online:bool,last_seen:string,last_seen_at:?string}>
     */
    public function getOnlineStatuses(array $userIds): array
    {
        if (empty($userIds)) {
            return [];
        }

        return User::query()
            ->whereIn('id', $userIds)
            ->get(['id', 'name', 'last_seen_at'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'is_online' => $user->isOnline(),
                'last_seen' => $user->getLastSeenFormatted(),
                'last_seen_at' => $user->last_seen_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
