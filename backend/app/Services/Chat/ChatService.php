<?php

namespace App\Services\Chat;

use App\Repositories\ChatRepository;
use Illuminate\Support\Facades\Log;

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
}