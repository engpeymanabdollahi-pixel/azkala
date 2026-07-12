<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\DTOs\Chat\SendMessageDTO;
use App\Services\Chat\ChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    protected ChatService $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * لیست مکالمات کاربر
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $filter = $request->get('filter', 'all');
            
            $conversations = $this->chatService->getUserConversations($userId, $filter);

            return response()->json([
                'success' => true,
                'data' => $conversations,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت مکالمات',
            ], 500);
        }
    }

    /**
     * شروع یا دریافت مکالمه
     */
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

            // Prevent self-conversation
            if ($userId === $sellerId) {
                return response()->json([
                    'success' => false,
                    'message' => 'نمی‌توانید با خودتان چت کنید',
                ], 400);
            }

            $conversation = $this->chatService->startConversation($userId, $sellerId, $productId);

            return response()->json([
                'success' => true,
                'data' => $conversation,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatController@startConversation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * نمایش جزئیات یک مکالمه
     */
    public function show(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            $conversation = $this->chatService->getConversationDetails((int) $conversationId, $userId);

            return response()->json([
                'success' => true,
                'data' => $conversation,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * دریافت پیام‌های یک مکالمه
     */
    public function getMessages(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            $perPage = (int) $request->get('per_page', 50);
            
            $messages = $this->chatService->getMessages((int) $conversationId, $userId, $perPage);

            return response()->json([
                'success' => true,
                'data' => $messages,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * ارسال پیام
     */
    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        try {
            $userId = $request->user()->id;
            
            $dto = SendMessageDTO::fromRequest($request, (int) $conversationId, $userId);
            $message = $this->chatService->sendMessage($dto);

            return response()->json([
                'success' => true,
                'data' => $message,
            ], 201);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * حذف مکالمه
     */
    public function deleteConversation(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            
            $result = $this->chatService->deleteConversation((int) $conversationId, $userId);

            return response()->json([
                'success' => true,
                'message' => 'مکالمه با موفقیت حذف شد',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * دریافت پیشنهادات محصول برای مکالمه
     */
    public function getProductSuggestions(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            $suggestions = $this->chatService->getProductSuggestions((int) $conversationId, $userId);

            return response()->json([
                'success' => true,
                'data' => $suggestions,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * پیشنهاد محصول در مکالمه
     */
    public function suggestProduct(Request $request, $conversationId)
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
        ]);

        try {
            $userId = $request->user()->id;
            $productId = (int) $request->product_id;
            
            $suggestion = $this->chatService->suggestProduct((int) $conversationId, $userId, $productId);

            return response()->json([
                'success' => true,
                'data' => $suggestion,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * دریافت آمار احساسات مکالمه
     */
    public function getSentimentStats(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;
            $stats = $this->chatService->getSentimentStats((int) $conversationId, $userId);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * دریافت وضعیت آنلاین کاربران
     */
    public function getOnlineStatus(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        try {
            $statuses = $this->chatService->getOnlineStatus($request->user_ids);

            return response()->json([
                'success' => true,
                'data' => $statuses,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatController@getOnlineStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت وضعیت آنلاین',
            ], 500);
        }
    }
}