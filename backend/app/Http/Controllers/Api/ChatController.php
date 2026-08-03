<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
}