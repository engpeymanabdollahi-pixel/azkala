<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Product;
use App\Services\Chat\ChatService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    protected ChatService $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    public function index(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $filter = $request->get('filter', 'all');
            $conversations = $this->chatService->getUserConversations($userId, $filter);
            return response()->json(['success' => true, 'data' => $conversations]);
        } catch (\Exception $e) {
            Log::error('ChatController@index: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت مکالمات'], 500);
        }
    }

    public function startConversation(Request $request)
    {
        $request->validate([
            'seller_id' => 'required|integer|exists:users,id',
            'product_id' => 'nullable|integer|exists:products,id',
        ]);

        try {
            $userId = $request->user()->id;
            $sellerId = (int) $request->seller_id;
            $productId = $request->product_id ? (int) $request->product_id : null;

            if ($userId === $sellerId) {
                return response()->json(['success' => false, 'message' => 'نمی‌توانید با خودتان چت کنید'], 400);
            }

            $conversation = $this->chatService->startConversation($userId, $sellerId, $productId);
            return response()->json(['success' => true, 'data' => $conversation]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('ChatController@startConversation: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getMessages(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            $perPage = (int) $request->get('per_page', 50);
            $messages = $this->chatService->getMessages((int) $conversationId, $userId, $perPage);
            return response()->json(['success' => true, 'data' => $messages]);
        } catch (\Exception $e) {
            Log::error('ChatController@getMessages: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function sendMessage(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;

            // 🛡️ دریافت صریح تمام کلیدهای ممکن از فرانت‌اند
            $val1 = $request->input('message');
            $val2 = $request->input('text');
            $val3 = $request->input('content');

            // انتخاب اولین مقداری که خالی نیست
            $messageText = trim($val1 ?? $val2 ?? $val3 ?? '');

            if (empty($messageText)) {
                return response()->json([
                    'success' => false,
                    'message' => 'متن پیام نمی‌تواند خالی باشد',
                ], 422);
            }

            $message = $this->chatService->sendMessage((int) $conversationId, $userId, $messageText);

            return response()->json([
                'success' => true,
                'data' => $message,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatController@sendMessage: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * جزئیات یک مکالمه. منطقش از قبل در ChatService::getConversation بود و فقط
     * همین سیم‌کشی کنترلر کم بود، برای همین روت ۵۰۰ می‌داد.
     */
    public function show(Request $request, $conversationId)
    {
        try {
            $conversation = $this->chatService->getConversation((int) $conversationId, $request->user()->id);

            return response()->json(['success' => true, 'data' => $conversation]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'مکالمه یافت نشد'], 404);
        } catch (\Exception $e) {
            Log::error('ChatController@show: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'خطا در دریافت مکالمه'], 500);
        }
    }

    public function deleteConversation(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            $this->chatService->deleteConversation((int) $conversationId, $userId);
            return response()->json(['success' => true, 'message' => 'مکالمه حذف شد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get online status of users in a conversation
     */
    public function getOnlineStatus(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'required|integer|exists:users,id',
            ]);

            $userIds = $validated['user_ids'];
            
            // Check online status using cache or presence channel
            // For now, return basic structure - can be enhanced with Redis/Presence channels
            $onlineStatus = [];
            foreach ($userIds as $userId) {
                // You can integrate with Laravel Presence Channels or Redis for real-time status
                $onlineStatus[$userId] = [
                    'user_id' => $userId,
                    'is_online' => false, // Implement actual online detection logic
                    'last_seen' => null,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $onlineStatus,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('ChatController@getOnlineStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت وضعیت آنلاین بودن',
            ], 500);
        }
    }

    /**
     * Get sentiment statistics for a conversation
     */
    public function getSentimentStats(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            
            // Verify user has access to this conversation
            $conversation = Conversation::where('id', (int) $conversationId)
                ->forUser($userId)
                ->first();

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'مکالمه یافت نشد',
                ], 404);
            }

            // Get messages and calculate sentiment stats
            $messages = Message::where('conversation_id', (int) $conversationId)
                ->select('sentiment_score', 'created_at')
                ->whereNotNull('sentiment_score')
                ->get();

            $stats = [
                'conversation_id' => (int) $conversationId,
                'total_messages' => $messages->count(),
                'positive_count' => $messages->where('sentiment_score', '>', 0)->count(),
                'neutral_count' => $messages->where('sentiment_score', '=', 0)->count(),
                'negative_count' => $messages->where('sentiment_score', '<', 0)->count(),
                'average_sentiment' => $messages->avg('sentiment_score') ?? 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatController@getSentimentStats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار احساسات',
            ], 500);
        }
    }

    /**
     * Get product suggestions for a conversation
     */
    public function getProductSuggestions(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            
            // Verify user has access to this conversation
            $conversation = Conversation::where('id', (int) $conversationId)
                ->forUser($userId)
                ->with(['product'])
                ->first();

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'مکالمه یافت نشد',
                ], 404);
            }

            $suggestions = [];
            
            // If conversation is about a product, suggest related products
            if ($conversation->product_id) {
                $suggestions = Product::where('category_id', $conversation->product->category_id ?? 0)
                    ->where('id', '!=', $conversation->product_id)
                    ->where('status', 'active')
                    ->limit(5)
                    ->get(['id', 'name', 'price', 'image'])
                    ->toArray();
            } else {
                // Suggest popular products based on conversation context
                $suggestions = Product::where('status', 'active')
                    ->orderBy('popularity_score', 'desc')
                    ->limit(5)
                    ->get(['id', 'name', 'price', 'image'])
                    ->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'conversation_id' => (int) $conversationId,
                    'suggestions' => $suggestions,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ChatController@getProductSuggestions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت پیشنهادات محصول',
            ], 500);
        }
    }
}