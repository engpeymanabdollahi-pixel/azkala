<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Repositories\AdminDashboardRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ChatMonitorController extends Controller
{
    public function __construct(protected AdminDashboardRepository $dashboardRepository) {}

    /**
     * لیست مکالمات با فیلترهای پیشرفته
     */
    public function index(Request $request)
    {
        try {
            $query = Conversation::with([
                'buyer:id,name,email,avatar,last_seen_at',
                'seller:id,name,email,avatar,shop_name,last_seen_at',
                'product:id,name,main_image',
            ])->withCount('messages');

            // فیلتر بر اساس وضعیت
            if ($request->filled('status') && $request->status !== 'all') {
                if ($request->status === 'active') {
                    $query->where('is_active', true);
                } else {
                    $query->where('is_active', false);
                }
            }

            // فیلتر بر اساس فروشنده
            if ($request->filled('seller_id')) {
                $query->where('seller_id', $request->seller_id);
            }

            // فیلتر بر اساس خریدار
            if ($request->filled('buyer_id')) {
                $query->where('buyer_id', $request->buyer_id);
            }

            // فیلتر بر اساس محصول
            if ($request->filled('product_id')) {
                $query->where('product_id', $request->product_id);
            }

            // فیلتر بر اساس تعداد پیام‌ها
            if ($request->filled('messages_count') && $request->messages_count !== 'all') {
                switch ($request->messages_count) {
                    case 'low':
                        $query->having('messages_count', '<=', 5);
                        break;
                    case 'medium':
                        $query->havingRaw('messages_count BETWEEN 6 AND 20');
                        break;
                    case 'high':
                        $query->having('messages_count', '>', 20);
                        break;
                }
            }

            // فیلتر بر اساس تاریخ
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // جستجو در پیام‌ها
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->whereHas('buyer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })->orWhereHas('seller', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })->orWhereHas('product', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
                });
            }

            $conversations = $query->orderByDesc('last_message_at')
                ->paginate(20);

            // اضافه کردن آخرین پیام به هر مکالمه
            $conversations->getCollection()->transform(function ($conv) {
                $lastMessage = Message::where('conversation_id', $conv->id)
                    ->with('sender:id,name')
                    ->orderByDesc('created_at')
                    ->first();

                $conv->last_message = $lastMessage;

                // وضعیت آنلاین کاربران
                $conv->buyer_online = $conv->buyer && $conv->buyer->last_seen_at &&
                                     Carbon::parse($conv->buyer->last_seen_at)->gte(now()->subMinutes(5));
                $conv->seller_online = $conv->seller && $conv->seller->last_seen_at &&
                                      Carbon::parse($conv->seller->last_seen_at)->gte(now()->subMinutes(5));

                return $conv;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'conversations' => $conversations->items(),
                    'pagination' => [
                        'current_page' => $conversations->currentPage(),
                        'last_page' => $conversations->lastPage(),
                        'per_page' => $conversations->perPage(),
                        'total' => $conversations->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ChatMonitorController@index: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت مکالمات',
            ], 500);
        }
    }

    /**
     * جزئیات یک مکالمه با تمام پیام‌ها
     */
    public function show($id)
    {
        try {
            $conversation = Conversation::with([
                'buyer:id,name,email,avatar,phone,last_seen_at',
                'seller:id,name,email,avatar,phone,shop_name,last_seen_at',
                'product:id,name,main_image,price,discount_price',
            ])->findOrFail($id);

            $messages = Message::where('conversation_id', $id)
                ->with('sender:id,name,avatar')
                ->orderBy('created_at')
                ->get();

            // آمار مکالمه
            $stats = [
                'total_messages' => $messages->count(),
                'buyer_messages' => $messages->where('sender_id', $conversation->buyer_id)->count(),
                'seller_messages' => $messages->where('sender_id', $conversation->seller_id)->count(),
                'system_messages' => $messages->where('type', 'system')->count(),
                'duration_days' => $conversation->created_at->diffInDays(now()),
                'last_activity' => $conversation->last_message_at?->diffForHumans(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'conversation' => $conversation,
                    'messages' => $messages,
                    'stats' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ChatMonitorController@show: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'مکالمه یافت نشد',
            ], 404);
        }
    }

    /**
     * مداخله ادمین در مکالمه (ارسال پیام)
     */
    public function intervene(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:1000',
            ]);

            $conversation = Conversation::findOrFail($id);
            $admin = $request->user();

            // ایجاد پیام از طرف ادمین
            $message = Message::create([
                'conversation_id' => $id,
                'sender_id' => $admin->id,
                'content' => $validated['message'],
                'type' => 'system',
            ]);

            $conversation->update(['last_message_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'پیام با موفقیت ارسال شد',
                'data' => $message->load('sender:id,name,avatar'),
            ]);
        } catch (ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('ChatMonitorController@intervene: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در ارسال پیام',
            ], 500);
        }
    }

    /**
     * بستن مکالمه
     */
    public function close($id)
    {
        try {
            $conversation = Conversation::findOrFail($id);
            $conversation->update(['is_active' => false]);

            // ارسال پیام سیستمی
            Message::create([
                'conversation_id' => $id,
                'sender_id' => auth()->id(),
                'content' => '🔒 این مکالمه توسط ادمین بسته شد.',
                'type' => 'system',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'مکالمه بسته شد',
            ]);
        } catch (\Exception $e) {
            Log::error('ChatMonitorController@close: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در بستن مکالمه',
            ], 500);
        }
    }

    /**
     * آمار کلی چت‌ها
     */
    public function stats(Request $request)
    {
        try {
            $totalConversations = Conversation::count();
            $activeConversations = Conversation::where('is_active', true)->count();
            $totalMessages = Message::count();
            $messagesToday = Message::whereDate('created_at', today())->count();

            // ✅ قبلاً میانگین زمان پاسخ همیشه عدد ثابت ۵ دقیقه بود (دقیقاً
            // همان باگی که در AdminDashboardService هم بود و آنجا رفع شد) —
            // همان محاسبهٔ واقعی از AdminDashboardRepository استفاده می‌شود.
            $avgResponseTime = $this->dashboardRepository->getAverageResponseMinutes();

            // ✅ قبلاً «نرخ تبدیل» از فرمول بی‌معنیِ (کل مکالمات / کل پیام‌ها)
            // محاسبه می‌شد که هیچ ارتباطی با تبدیل واقعی نداشت. اینجا واقعاً
            // درصد مکالماتی که به خرید همان محصول از همان فروشنده منجر شده‌اند
            // محاسبه می‌شود.
            $conversationsWithProduct = Conversation::whereNotNull('product_id')->count();
            $convertedConversations = $conversationsWithProduct > 0
                ? DB::table('conversations')
                    ->whereNotNull('conversations.product_id')
                    ->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('orders')
                            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                            ->whereColumn('orders.user_id', 'conversations.buyer_id')
                            ->whereColumn('order_items.product_id', 'conversations.product_id')
                            ->whereColumn('order_items.seller_id', 'conversations.seller_id')
                            ->whereColumn('orders.created_at', '>=', 'conversations.created_at');
                    })
                    ->count()
                : 0;
            $conversionRate = $conversationsWithProduct > 0
                ? round(($convertedConversations / $conversationsWithProduct) * 100, 1)
                : 0;

            // آمار روزانه (۷ روز اخیر)
            $dailyStats = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $count = Message::whereDate('created_at', $date)->count();
                $dailyStats[] = [
                    'date' => now()->subDays($i)->format('Y-m-d'),
                    'label' => now()->subDays($i)->locale('fa')->isoFormat('dddd'),
                    'count' => $count,
                ];
            }

            // فروشندگان برتر (بر اساس تعداد مکالمات)
            $topSellers = User::where('role', 'seller')
                ->withCount(['conversationsAsSeller as conversations_count'])
                ->orderByDesc('conversations_count')
                ->limit(5)
                ->get()
                ->map(function ($seller) {
                    return [
                        'id' => $seller->id,
                        'name' => $seller->name,
                        'shop_name' => $seller->shop_name,
                        'conversations_count' => $seller->conversations_count,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_conversations' => $totalConversations,
                    'active_conversations' => $activeConversations,
                    'total_messages' => $totalMessages,
                    'messages_today' => $messagesToday,
                    'avg_response_time' => $avgResponseTime,
                    'conversion_rate' => $conversionRate,
                    'daily_stats' => $dailyStats,
                    'top_sellers' => $topSellers,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ChatMonitorController@stats: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار',
            ], 500);
        }
    }

    // ✅ متد critical() که اینجا بود حذف شد: به رابطهٔ ناموجود
    // Message::sentiment() ارجاع می‌داد (هیچ‌وقت روی مدل Message تعریف
    // نشده بود) و هرگز فراخوانی نمی‌شد — یعنی اگر هم صدا زده می‌شد بلافاصله
    // با خطای ۵۰۰ (BadMethodCallException) کرش می‌کرد. همین قابلیت
    // «مکالمات با احساس منفی» به‌درستی و با کوئری واقعی در
    // SentimentDashboardController::alerts() پیاده‌سازی شده و از طریق تب
    // «تحلیل احساسات» در دسترس ادمین است.
}
