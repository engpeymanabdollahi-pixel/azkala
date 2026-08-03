<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserTicketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserTicketController extends Controller
{
    protected UserTicketService $userTicketService;

    public function __construct(UserTicketService $userTicketService)
    {
        $this->userTicketService = $userTicketService;
    }

    /**
     * لیست تیکت‌های کاربر
     */
    public function index(Request $request)
    {
        try {
            $result = $this->userTicketService->getUserTickets(
                $request->user()->id,
                $request->filled('status') ? $request->status : null
            );
            $tickets = $result['tickets'];

            return response()->json([
                'success' => true,
                'data' => [
                    'tickets' => $tickets->items(),
                    'pagination' => [
                        'current_page' => $tickets->currentPage(),
                        'last_page' => $tickets->lastPage(),
                        'total' => $tickets->total(),
                    ],
                    'stats' => $result['stats'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('UserTicketController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت تیکت‌ها',
            ], 500);
        }
    }

    /**
     * جزئیات تیکت با پیام‌ها
     */
    public function show(Request $request, $id)
    {
        try {
            $ticket = $this->userTicketService->getUserTicketDetail((int) $id, $request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $ticket,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'تیکت یافت نشد',
            ], 404);
        }
    }

    /**
     * ساخت تیکت جدید
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'subject' => 'required|string|max:500',
                'description' => 'required|string|max:5000',
                'priority' => 'required|in:low,medium,high,urgent',
                'category' => 'required|in:general,technical,payment,shipping,product,account,other',
                'conversation_id' => 'nullable|integer|exists:conversations,id',
            ]);

            $ticket = $this->userTicketService->createTicket($request->user()->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'تیکت با موفقیت ایجاد شد',
                'data' => $ticket,
            ], 201);
        } catch (\Exception $e) {
            Log::error('UserTicketController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ایجاد تیکت',
            ], 500);
        }
    }

    /**
     * تبدیل مکالمه به تیکت
     */
    public function convertFromConversation(Request $request, $conversationId)
    {
        try {
            $userId = $request->user()->id;

            $conversation = $this->userTicketService->findConversationForTicket((int) $conversationId);

            // بررسی اینکه کاربر صاحب مکالمه باشد
            if ($conversation->buyer_id !== $userId && $conversation->seller_id !== $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما اجازه تبدیل این مکالمه را ندارید',
                ], 403);
            }

            $validated = $request->validate([
                'subject' => 'required|string|max:500',
                'priority' => 'required|in:low,medium,high,urgent',
                'category' => 'required|in:general,technical,payment,shipping,product,account,other',
            ]);

            $ticket = $this->userTicketService->convertConversationToTicket($conversation, $userId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'مکالمه با موفقیت به تیکت تبدیل شد',
                'data' => $ticket,
            ], 201);
        } catch (\Exception $e) {
            Log::error('UserTicketController@convertFromConversation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در تبدیل مکالمه',
            ], 500);
        }
    }

    /**
     * ارسال پیام در تیکت
     */
    public function sendMessage(Request $request, $id)
    {
        try {
            $userId = $request->user()->id;

            $validated = $request->validate([
                'message' => 'required|string|max:5000',
            ]);

            $message = $this->userTicketService->sendMessage((int) $id, $userId, $validated['message']);

            return response()->json([
                'success' => true,
                'message' => 'پیام ارسال شد',
                'data' => $message,
            ]);
        } catch (\Exception $e) {
            Log::error('UserTicketController@sendMessage: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ارسال پیام',
            ], 500);
        }
    }
}