<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserTicketController extends Controller
{
    /**
     * لیست تیکت‌های کاربر
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->user()->id;

            $query = SupportTicket::where('user_id', $userId)
                ->withCount('messages')
                ->with('assignedUser:id,name');

            // فیلتر بر اساس وضعیت
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $tickets = $query->orderByDesc('created_at')->paginate(10);

            // آمار
            $stats = [
                'total' => SupportTicket::where('user_id', $userId)->count(),
                'open' => SupportTicket::where('user_id', $userId)->where('status', 'open')->count(),
                'in_progress' => SupportTicket::where('user_id', $userId)->where('status', 'in_progress')->count(),
                'resolved' => SupportTicket::where('user_id', $userId)->where('status', 'resolved')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'tickets' => $tickets->items(),
                    'pagination' => [
                        'current_page' => $tickets->currentPage(),
                        'last_page' => $tickets->lastPage(),
                        'total' => $tickets->total(),
                    ],
                    'stats' => $stats,
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
            $userId = $request->user()->id;

            $ticket = SupportTicket::where('user_id', $userId)
                ->with([
                    'assignedUser:id,name,avatar',
                    'messages' => function ($q) {
                        $q->with('user:id,name,avatar')->orderBy('created_at');
                    },
                ])
                ->findOrFail($id);

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

            $ticket = SupportTicket::create([
                'ticket_number' => SupportTicket::generateTicketNumber(),
                'user_id' => $request->user()->id,
                'conversation_id' => $validated['conversation_id'] ?? null,
                'subject' => $validated['subject'],
                'description' => $validated['description'],
                'priority' => $validated['priority'],
                'category' => $validated['category'],
                'status' => 'open',
            ]);

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

            $conversation = Conversation::with([
                'buyer:id,name,email',
                'seller:id,name,email',
                'messages' => function ($q) {
                    $q->orderBy('created_at')->limit(10);
                },
            ])->findOrFail($conversationId);

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

            // ساخت خلاصه از مکالمه
            $summary = "مکالمه بین {$conversation->buyer->name} و {$conversation->seller->name}\n\n";
            $summary .= "آخرین پیام‌ها:\n";
            foreach ($conversation->messages as $msg) {
                $senderName = $msg->sender->name ?? 'ناشناس';
                $summary .= "- {$senderName}: {$msg->content}\n";
            }

            $ticket = SupportTicket::create([
                'ticket_number' => SupportTicket::generateTicketNumber(),
                'conversation_id' => $conversation->id,
                'user_id' => $userId,
                'subject' => $validated['subject'],
                'description' => $summary,
                'priority' => $validated['priority'],
                'category' => $validated['category'],
                'status' => 'open',
            ]);

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

            $ticket = SupportTicket::where('user_id', $userId)->findOrFail($id);

            $validated = $request->validate([
                'message' => 'required|string|max:5000',
            ]);

            $message = TicketMessage::create([
                'ticket_id' => $id,
                'user_id' => $userId,
                'message' => $validated['message'],
                'is_internal' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'پیام ارسال شد',
                'data' => $message->load('user:id,name,avatar'),
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