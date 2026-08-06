<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Coupon;
use App\Models\Message;
use App\Models\MessageSentiment;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDashboardRepository
{
    /**
     * Get total statistics
     */
    public function getTotalStats(): array
    {
        return [
            'total_products' => Product::where('is_active', true)->count(),
            'total_orders' => Order::count(),
            'total_users' => User::count(),
            'total_revenue' => (float) Order::where('status', '!=', 'cancelled')->sum('total'),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'completed_orders' => Order::where('status', 'completed')->count(),
            'total_reviews' => Review::count(),
            'total_coupons' => Coupon::count(),
        ];
    }

    /**
     * Get recent orders
     */
    public function getRecentOrders(int $limit = 10): Collection
    {
        return Order::with('user:id,name')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_name' => $order->user->name ?? 'کاربر حذف‌شده',
                    'total' => (float) $order->total,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('Y-m-d H:i'),
                ];
            });
    }

    /**
     * Get recent users
     */
    public function getRecentUsers(int $limit = 10): Collection
    {
        return User::orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->format('Y-m-d'),
                ];
            });
    }

    /**
     * Get top products by sales
     */
    public function getTopProducts(int $limit = 10): Collection
    {
        return Product::where('is_active', true)
            ->orderByDesc('sales_count')
            ->limit($limit)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sales_count' => $product->sales_count ?? 0,
                    'revenue' => ($product->sales_count ?? 0) * $product->price,
                ];
            });
    }

    /**
     * Get monthly statistics (last 6 months)
     */
    public function getMonthlyStats(): array
    {
        $stats = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthName = $date->format('F');

            $orders = Order::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->where('status', '!=', 'cancelled')
                ->count();

            $revenue = Order::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->where('status', '!=', 'cancelled')
                ->sum('total');

            $stats[] = [
                'month' => $monthName,
                'orders' => $orders,
                'revenue' => (float) $revenue,
            ];
        }

        return $stats;
    }

    /**
     * Get chat statistics
     */
    public function getChatStats(): array
    {
        return [
            'active_conversations' => Conversation::where('is_active', true)->count(),
            'total_conversations' => Conversation::count(),
            'messages_today' => Message::whereDate('created_at', today())->count(),
            'total_messages' => Message::count(),
        ];
    }

    /**
     * Get sentiment statistics
     */
    public function getSentimentStats(): Collection
    {
        return MessageSentiment::selectRaw('sentiment, count(*) as count')
            ->groupBy('sentiment')
            ->get()
            ->pluck('count', 'sentiment');
    }

    /**
     * Get recent chat messages
     */
    public function getRecentChatMessages(int $limit = 10): Collection
    {
        return Message::with(['sender:id,name,avatar', 'conversation:id,buyer_id,seller_id'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => mb_substr($message->content, 0, 50),
                    'sender_name' => $message->sender->name ?? 'ناشناس',
                    'sender_avatar' => $message->sender->avatar,
                    'conversation_id' => $message->conversation_id,
                    'created_at' => $message->created_at->diffForHumans(),
                    'type' => $message->type,
                ];
            });
    }

    /**
     * Get active sellers count
     */
    public function getActiveSellersCount(): int
    {
        return Conversation::where('is_active', true)
            ->distinct('seller_id')
            ->count('seller_id');
    }

    /**
     * ✅ قبلاً avg_response_minutes همیشه عدد ثابت ۵ بود («مقدار پیش‌فرض»
     * طبق کامنت قدیمی) — بدون هیچ ارتباطی با پیام‌های واقعی. اینجا میانگین
     * واقعی فاصله‌ی زمانی بین پیام هر کاربر تا اولین پاسخ طرف مقابل در همان
     * مکالمه (در ۳۰ روز اخیر) محاسبه می‌شود. پاسخ‌های با فاصله بیش از ۲۴
     * ساعت نادیده گرفته می‌شوند تا مکالمات رهاشده میانگین را خراب نکنند.
     */
    public function getAverageResponseMinutes(): float
    {
        $messages = Message::where('created_at', '>=', now()->subDays(30))
            ->orderBy('conversation_id')
            ->orderBy('created_at')
            ->get(['conversation_id', 'sender_id', 'created_at']);

        $responseTimes = [];

        foreach ($messages->groupBy('conversation_id') as $convMessages) {
            $convMessages = $convMessages->values();

            for ($i = 1; $i < $convMessages->count(); $i++) {
                $previous = $convMessages[$i - 1];
                $current = $convMessages[$i];

                // فقط وقتی فرستنده عوض شده (پاسخِ واقعیِ طرف مقابل، نه پیام پشت‌سرهمِ خودِ یک نفر)
                if ($previous->sender_id === $current->sender_id) {
                    continue;
                }

                $diffMinutes = $previous->created_at->diffInMinutes($current->created_at);
                if ($diffMinutes <= 1440) {
                    $responseTimes[] = $diffMinutes;
                }
            }
        }

        if (empty($responseTimes)) {
            return 0;
        }

        return round(array_sum($responseTimes) / count($responseTimes), 1);
    }

    /**
     * ✅ قبلاً busiest_hour همیشه رشته‌ی ثابت «۱۴:۰۰ - ۱۶:۰۰» بود («مقدار
     * ثابت» طبق کامنت قدیمی). اینجا از توزیع واقعی ساعتِ پیام‌های ۳۰ روز
     * اخیر محاسبه می‌شود.
     */
    public function getBusiestHour(): ?string
    {
        $driver = DB::connection()->getDriverName();
        $hourExpr = $driver === 'sqlite'
            ? "CAST(strftime('%H', created_at) AS INTEGER)"
            : 'HOUR(created_at)';

        $result = Message::selectRaw("{$hourExpr} as hour, COUNT(*) as message_count")
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('hour')
            ->orderByDesc('message_count')
            ->first();

        if (! $result) {
            return null;
        }

        $hour = (int) $result->hour;

        return sprintf('%02d:00 - %02d:00', $hour, ($hour + 1) % 24);
    }
}
