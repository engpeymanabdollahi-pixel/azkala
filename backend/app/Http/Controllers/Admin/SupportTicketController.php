<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SupportTicketController extends Controller
{
    /**
     * لیست تیکت‌ها با فیلترهای پیشرفته
     */
    public function index(Request $request)
    {
        try {
            $query = SupportTicket::with([
                'user:id,name,email,avatar',
                'assignedUser:id,name,avatar',
                'conversation:id,buyer_id,seller_id',
            ])->withCount('messages');

            // فیلتر بر اساس وضعیت
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // فیلتر بر اساس اولویت
            if ($request->filled('priority') && $request->priority !== 'all') {
                $query->where('priority', $request->priority);
            }

            // فیلتر بر اساس دسته‌بندی
            if ($request->filled('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // فیلتر بر اساس پشتیبان
            if ($request->filled('assigned_to')) {
                if ($request->assigned_to === 'unassigned') {
                    $query->whereNull('assigned_to');
                } else {
                    $query->where('assigned_to', $request->assigned_to);
                }
            }

            // فیلتر بر اساس ارجاع شده
            if ($request->filled('escalated') && $request->escalated === 'yes') {
                $query->where('is_escalated', true);
            }

            // فیلتر بر اساس تاریخ
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // جستجو
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('ticket_number', 'like', "%{$search}%")
                      ->orWhere('subject', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }

            $tickets = $query->orderByDesc('created_at')->paginate(20);

            // آمار کلی
            $stats = [
                'total' => SupportTicket::count(),
                'open' => SupportTicket::where('status', 'open')->count(),
                'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
                'resolved' => SupportTicket::where('status', 'resolved')->count(),
                'closed' => SupportTicket::where('status', 'closed')->count(),
                'urgent' => SupportTicket::where('priority', 'urgent')->count(),
                'unassigned' => SupportTicket::whereNull('assigned_to')->where('status', '!=', 'closed')->count(),
                'escalated' => SupportTicket::where('is_escalated', true)->count(),
                'avg_response_time' => round(SupportTicket::whereNotNull('response_time_minutes')->avg('response_time_minutes') ?? 0),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'tickets' => $tickets->items(),
                    'pagination' => [
                        'current_page' => $tickets->currentPage(),
                        'last_page' => $tickets->lastPage(),
                        'per_page' => $tickets->perPage(),
                        'total' => $tickets->total(),
                    ],
                    'stats' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupportTicketController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت تیکت‌ها',
            ], 500);
        }
    }

    /**
     * جزئیات تیکت با پیام‌ها
     */
    public function show($id)
    {
        try {
            $ticket = SupportTicket::with([
                'user:id,name,email,avatar,phone',
                'assignedUser:id,name,avatar',
                'conversation:id,buyer_id,seller_id,product_id',
                'messages' => function ($q) {
                    $q->with('user:id,name,avatar')->orderBy('created_at');
                },
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $ticket,
            ]);
        } catch (\Exception $e) {
            Log::error('SupportTicketController@show: ' . $e->getMessage());
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
                'user_id' => 'required|integer|exists:users,id',
                'conversation_id' => 'nullable|integer|exists:conversations,id',
            ]);

            $ticket = SupportTicket::create([
                'ticket_number' => SupportTicket::generateTicketNumber(),
                'user_id' => $validated['user_id'],
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
            Log::error('SupportTicketController@store: ' . $e->getMessage());
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
            $conversation = Conversation::with([
                'buyer:id,name,email',
                'seller:id,name,email',
                'messages' => function ($q) {
                    $q->orderBy('created_at')->limit(10);
                },
            ])->findOrFail($conversationId);

            $validated = $request->validate([
                'subject' => 'required|string|max:500',
                'priority' => 'required|in:low,medium,high,urgent',
                'category' => 'required|in:general,technical,payment,shipping,product,account,other',
            ]);

            // ساخت خلاصه از مکالمه
            $summary = "مکالمه بین {$conversation->buyer->name} و {$conversation->seller->name}\n\n";
            $summary .= "آخرین پیام‌ها:\n";
            foreach ($conversation->messages as $msg) {
                $summary .= "- {$msg->sender->name}: {$msg->content}\n";
            }

            $ticket = SupportTicket::create([
                'ticket_number' => SupportTicket::generateTicketNumber(),
                'conversation_id' => $conversation->id,
                'user_id' => $conversation->buyer_id,
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
            Log::error('SupportTicketController@convertFromConversation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در تبدیل مکالمه',
            ], 500);
        }
    }

    /**
     * بروزرسانی تیکت
     */
    public function update(Request $request, $id)
    {
        try {
            $ticket = SupportTicket::findOrFail($id);

            $validated = $request->validate([
                'subject' => 'sometimes|string|max:500',
                'priority' => 'sometimes|in:low,medium,high,urgent',
                'category' => 'sometimes|in:general,technical,payment,shipping,product,account,other',
                'status' => 'sometimes|in:open,in_progress,resolved,closed',
                'resolution_notes' => 'nullable|string|max:2000',
            ]);

            // اگر وضعیت به resolved تغییر کرد
            if (isset($validated['status']) && $validated['status'] === 'resolved') {
                $ticket->resolve($validated['resolution_notes'] ?? '');
            }
            // اگر وضعیت به closed تغییر کرد
            elseif (isset($validated['status']) && $validated['status'] === 'closed') {
                $ticket->close();
            }
            else {
                $ticket->update($validated);
            }

            return response()->json([
                'success' => true,
                'message' => 'تیکت بروزرسانی شد',
                'data' => $ticket,
            ]);
        } catch (\Exception $e) {
            Log::error('SupportTicketController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بروزرسانی',
            ], 500);
        }
    }

    /**
     * اختصاص تیکت به پشتیبان
     */
    public function assign(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'assigned_to' => 'required|integer|exists:users,id',
            ]);

            $ticket = SupportTicket::findOrFail($id);
            $ticket->assignTo($validated['assigned_to']);

            return response()->json([
                'success' => true,
                'message' => 'تیکت اختصاص داده شد',
                'data' => $ticket,
            ]);
        } catch (\Exception $e) {
            Log::error('SupportTicketController@assign: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در اختصاص',
            ], 500);
        }
    }

    /**
     * ارجاع به مدیر
     */
    public function escalate($id)
    {
        try {
            $ticket = SupportTicket::findOrFail($id);
            $ticket->escalate();

            return response()->json([
                'success' => true,
                'message' => 'تیکت به مدیر ارجاع شد',
                'data' => $ticket,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * ارسال پیام در تیکت
     */
    public function sendMessage(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:5000',
                'is_internal' => 'boolean',
            ]);

            $ticket = SupportTicket::findOrFail($id);

            $message = TicketMessage::create([
                'ticket_id' => $id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
                'is_internal' => $validated['is_internal'] ?? false,
            ]);

            // اگر تیکت باز است، به in_progress تغییر بده
            if ($ticket->status === 'open') {
                $ticket->update(['status' => 'in_progress']);
            }

            return response()->json([
                'success' => true,
                'message' => 'پیام ارسال شد',
                'data' => $message->load('user:id,name,avatar'),
            ]);
        } catch (\Exception $e) {
            Log::error('SupportTicketController@sendMessage: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ارسال پیام',
            ], 500);
        }
    }

    /**
     * آمار تیکت‌ها
     */
    public function stats()
    {
        try {
            $stats = [
                'total' => SupportTicket::count(),
                'by_status' => [
                    'open' => SupportTicket::where('status', 'open')->count(),
                    'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
                    'resolved' => SupportTicket::where('status', 'resolved')->count(),
                    'closed' => SupportTicket::where('status', 'closed')->count(),
                ],
                'by_priority' => [
                    'low' => SupportTicket::where('priority', 'low')->count(),
                    'medium' => SupportTicket::where('priority', 'medium')->count(),
                    'high' => SupportTicket::where('priority', 'high')->count(),
                    'urgent' => SupportTicket::where('priority', 'urgent')->count(),
                ],
                'by_category' => SupportTicket::selectRaw('category, count(*) as count')
                    ->groupBy('category')
                    ->pluck('count', 'category'),
                'avg_response_time' => round(SupportTicket::whereNotNull('response_time_minutes')->avg('response_time_minutes') ?? 0),
                'today' => SupportTicket::whereDate('created_at', today())->count(),
                'this_week' => SupportTicket::whereDate('created_at', '>=', now()->subDays(7))->count(),
                'this_month' => SupportTicket::whereDate('created_at', '>=', now()->subDays(30))->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('SupportTicketController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار',
            ], 500);
        }
    }

    /**
     * لیست پشتیبان‌ها (ادمین‌ها)
     */
    public function getSupportStaff()
    {
        try {
            $staff = User::where('role', 'admin')
                ->select('id', 'name', 'email', 'avatar')
                ->withCount([
                    'assignedTickets as tickets_count' => function ($q) {
                        $q->where('status', '!=', 'closed');
                    }
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $staff,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }
}