<?php

namespace App\Services\Chat;

use App\DTOs\Chat\SendMessageDTO;
use App\Repositories\ChatRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class ChatService
{
    protected ChatRepository $chatRepository;

    public function __construct(ChatRepository $chatRepository)
    {
        $this->chatRepository = $chatRepository;
    }

    /**
     * Get user conversations
     */
    public function getUserConversations(int $userId, string $filter = 'all'): array
    {
        $conversations = $this->chatRepository->getUserConversations($userId, $filter);

        return $conversations->map(function ($conv) use ($userId) {
            $otherUser = $conv->buyer_id === $userId ? $conv->seller : $conv->user;
            
            return [
                'id' => $conv->id,
                'buyer_id' => $conv->buyer_id,
                'seller_id' => $conv->seller_id,
                'product_id' => $conv->product_id,
                'status' => $conv->status,
                'unread_count' => $conv->unread_count ?? 0,
                'last_message' => $conv->lastMessage ? [
                    'message' => $conv->lastMessage->message,
                    'created_at' => $conv->lastMessage->created_at,
                    'sender_id' => $conv->lastMessage->sender_id,
                ] : null,
                'other_user' => $otherUser ? [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'shop_name' => $otherUser->shop_name ?? null,
                    'avatar' => $otherUser->avatar ?? null,
                ] : null,
                'product' => $conv->product ? [
                    'id' => $conv->product->id,
                    'name' => $conv->product->name,
                    'main_image' => $conv->product->main_image,
                ] : null,
                'created_at' => $conv->created_at,
                'updated_at' => $conv->updated_at,
            ];
        })->toArray();
    }

    /**
     * Start or get conversation
     */
    public function startConversation(int $userId, int $sellerId, ?int $productId = null): array
    {
        $conversation = $this->chatRepository->getOrCreateConversation(
            $userId,
            $sellerId,
            $productId
        );

        return [
            'id' => $conversation->id,
            'buyer_id' => $conversation->buyer_id,
            'seller_id' => $conversation->seller_id,
            'product_id' => $conversation->product_id,
            'status' => $conversation->status,
            'user' => [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
            ],
            'seller' => [
                'id' => $conversation->seller->id,
                'name' => $conversation->seller->name,
                'shop_name' => $conversation->seller->shop_name,
            ],
            'product' => $conversation->product ? [
                'id' => $conversation->product->id,
                'name' => $conversation->product->name,
            ] : null,
        ];
    }

    /**
     * Get conversation details
     */
    public function getConversationDetails(int $conversationId, int $userId): array
    {
        $conversation = $this->chatRepository->find($conversationId);

        if (!$conversation) {
            throw new \Exception('ظ…ع©ط§ظ„ظ…ظ‡ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        // Check if user is participant
        if ($conversation->buyer_id !== $userId && $conversation->seller_id !== $userId) {
            throw new \Exception('ط´ظ…ط§ ط¯ط³طھط±ط³غŒ ط¨ظ‡ ط§غŒظ† ظ…ع©ط§ظ„ظ…ظ‡ ط±ط§ ظ†ط¯ط§ط±غŒط¯', 403);
        }

        return [
            'id' => $conversation->id,
            'user' => [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
            ],
            'seller' => [
                'id' => $conversation->seller->id,
                'name' => $conversation->seller->name,
                'shop_name' => $conversation->seller->shop_name,
            ],
            'product' => $conversation->product ? [
                'id' => $conversation->product->id,
                'name' => $conversation->product->name,
            ] : null,
        ];
    }

    /**
     * Get messages for a conversation
     */
    public function getMessages(int $conversationId, int $userId, int $perPage = 50): array
    {
        // Check access
        $this->getConversationDetails($conversationId, $userId);

        // Mark as read
        $this->chatRepository->markAsRead($conversationId, $userId);

        // Get messages
        $messages = $this->chatRepository->getMessages($conversationId, $perPage);

        return [
            'data' => $messages->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'conversation_id' => $msg->conversation_id,
                    'sender_id' => $msg->sender_id,
                    'message' => $msg->message,
                    'status' => $msg->status,
                    'created_at' => $msg->created_at,
                    'sender' => [
                        'id' => $msg->sender->id,
                        'name' => $msg->sender->name,
                    ],
                ];
            }),
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'per_page' => $messages->perPage(),
            'total' => $messages->total(),
        ];
    }

    /**
     * Send a message
     */
    public function sendMessage(SendMessageDTO $dto): array
    {
        // Validate
        $errors = $dto->validate();
        if (!empty($errors)) {
            throw new \Exception(implode(', ', $errors), 422);
        }

        // Check conversation access
        $conversation = $this->chatRepository->find($dto->conversation_id);
        
        if (!$conversation) {
            throw new \Exception('ظ…ع©ط§ظ„ظ…ظ‡ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        if ($conversation->buyer_id !== $dto->sender_id && 
            $conversation->seller_id !== $dto->sender_id) {
            throw new \Exception('ط´ظ…ط§ ط¯ط³طھط±ط³غŒ ط¨ظ‡ ط§غŒظ† ظ…ع©ط§ظ„ظ…ظ‡ ط±ط§ ظ†ط¯ط§ط±غŒط¯', 403);
        }

        // Send message
        $message = $this->chatRepository->sendMessage(
            $dto->conversation_id,
            $dto->sender_id,
            $dto->message
        );

        // Update conversation timestamp
        $conversation->touch();

        Log::info("Message sent in conversation {$dto->conversation_id} by user {$dto->sender_id}");

        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'message' => $message->message,
            'status' => $message->status,
            'created_at' => $message->created_at,
        ];
    }

    /**
     * Delete conversation
     */
    public function deleteConversation(int $conversationId, int $userId): bool
    {
        $result = $this->chatRepository->deleteConversation($conversationId, $userId);

        if (!$result) {
            throw new \Exception('ط®ط·ط§ ط¯ط± ط­ط°ظپ ظ…ع©ط§ظ„ظ…ظ‡', 400);
        }

        Log::info("Conversation {$conversationId} deleted by user {$userId}");

        return true;
    }

    /**
     * Get unread count
     */
    public function getUnreadCount(int $userId): int
    {
        return $this->chatRepository->getUnreadCount($userId);
    }
    /**
     * Get product suggestions for a conversation
     */
    public function getProductSuggestions(int $conversationId, int $userId): array
    {
        // Check access
        $conversation = $this->chatRepository->find($conversationId);
        
        if (!$conversation) {
            throw new \Exception('ظ…ع©ط§ظ„ظ…ظ‡ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        if ($conversation->buyer_id !== $userId && $conversation->seller_id !== $userId) {
            throw new \Exception('ط´ظ…ط§ ط¯ط³طھط±ط³غŒ ط¨ظ‡ ط§غŒظ† ظ…ع©ط§ظ„ظ…ظ‡ ط±ط§ ظ†ط¯ط§ط±غŒط¯', 403);
        }

        // Get seller's products
        $sellerId = $conversation->seller_id;
        $products = \App\Models\Product::with('images')
            ->where('seller_id', $sellerId)
            ->where('is_active', true)
            ->orderByDesc('sales_count')
            ->limit(10)
            ->get();

        return $products->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'main_image' => $product->main_image,
                'price' => (float) $product->price,
                'stock' => $product->stock,
            ];
        })->toArray();
    }

    /**
     * Suggest a product in conversation
     */
    public function suggestProduct(int $conversationId, int $senderId, int $productId): array
    {
        // Check conversation access
        $conversation = $this->chatRepository->find($conversationId);
        
        if (!$conversation) {
            throw new \Exception('ظ…ع©ط§ظ„ظ…ظ‡ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        if ($conversation->seller_id !== $senderId) {
            throw new \Exception('ظپظ‚ط· ظپط±ظˆط´ظ†ط¯ظ‡ ظ…غŒâ€Œطھظˆط§ظ†ط¯ ظ…ط­طµظˆظ„ ظ¾غŒط´ظ†ظ‡ط§ط¯ ط¯ظ‡ط¯', 403);
        }

        // Get product
        $product = \App\Models\Product::find($productId);
        if (!$product) {
            throw new \Exception('ظ…ط­طµظˆظ„ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        // Create suggestion message
        $message = "ًں›چï¸ڈ ظ¾غŒط´ظ†ظ‡ط§ط¯ ظ…ط­طµظˆظ„: {$product->name}\nًں’° ظ‚غŒظ…طھ: " . number_format($product->price) . " طھظˆظ…ط§ظ†\nًں”— /products/{$product->slug}";

        $sentMessage = $this->chatRepository->sendMessage(
            $conversationId,
            $senderId,
            $message
        );

        return [
            'id' => $sentMessage->id,
            'message' => $sentMessage->message,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'main_image' => $product->main_image,
                'price' => (float) $product->price,
            ],
        ];
    }

    /**
     * Get sentiment stats for a conversation
     */
    public function getSentimentStats(int $conversationId, int $userId): array
    {
        // Check access
        $conversation = $this->chatRepository->find($conversationId);
        
        if (!$conversation) {
            throw new \Exception('ظ…ع©ط§ظ„ظ…ظ‡ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        if ($conversation->buyer_id !== $userId && $conversation->seller_id !== $userId) {
            throw new \Exception('ط´ظ…ط§ ط¯ط³طھط±ط³غŒ ط¨ظ‡ ط§غŒظ† ظ…ع©ط§ظ„ظ…ظ‡ ط±ط§ ظ†ط¯ط§ط±غŒط¯', 403);
        }

        // Get sentiment data
        $sentiments = \App\Models\MessageSentiment::where('conversation_id', $conversationId)
            ->get();

        $total = $sentiments->count();
        $positive = $sentiments->where('sentiment', 'positive')->count();
        $negative = $sentiments->where('sentiment', 'negative')->count();
        $neutral = $sentiments->where('sentiment', 'neutral')->count();

        return [
            'total_messages' => $total,
            'positive' => $positive,
            'negative' => $negative,
            'neutral' => $neutral,
            'positive_percentage' => $total > 0 ? round(($positive / $total) * 100, 2) : 0,
            'negative_percentage' => $total > 0 ? round(($negative / $total) * 100, 2) : 0,
            'neutral_percentage' => $total > 0 ? round(($neutral / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Get online status for users
     */
    public function getOnlineStatus(array $userIds): array
    {
        $statuses = [];
        
        foreach ($userIds as $userId) {
            $user = \App\Models\User::find($userId);
            
            if ($user) {
                $lastSeen = $user->last_seen_at;
                $isOnline = $lastSeen && $lastSeen->gt(now()->subMinutes(5));
                
                $statuses[$userId] = [
                    'buyer_id' => $userId,
                    'is_online' => $isOnline,
                    'last_seen_at' => $lastSeen,
                    'status' => $isOnline ? 'online' : 'offline',
                ];
            }
        }

        return $statuses;
    }
}