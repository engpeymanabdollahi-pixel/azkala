<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MessageSentiment;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SentimentDashboardController extends Controller
{
    /**
     * آمار کلی و روند ۳۰ روزه
     */
    public function dashboard()
    {
        try {
            // روند ۳۰ روز اخیر
            $trend = MessageSentiment::selectRaw('DATE(created_at) as date, sentiment, count(*) as count')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date', 'sentiment')
                ->orderBy('date')
                ->get()
                ->groupBy('date');

            // تبدیل به فرمت Frontend
            $chartData = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $items = $trend->get($date, collect());
                
                $chartData[] = [
                    'date' => now()->subDays($i)->locale('fa')->isoFormat('D MMM'),
                    'positive' => $items->firstWhere('sentiment', 'positive')?->count ?? 0,
                    'neutral' => $items->firstWhere('sentiment', 'neutral')?->count ?? 0,
                    'negative' => $items->firstWhere('sentiment', 'negative')?->count ?? 0,
                ];
            }

            // توزیع کلی
            $distribution = MessageSentiment::selectRaw('sentiment, count(*) as count')
                ->groupBy('sentiment')
                ->get()
                ->pluck('count', 'sentiment');

            $total = $distribution->sum();
            $positive = $distribution->get('positive', 0);
            $neutral = $distribution->get('neutral', 0);
            $negative = $distribution->get('negative', 0);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_analyzed' => $total,
                    'positive' => $positive,
                    'neutral' => $neutral,
                    'negative' => $negative,
                    'positive_percent' => $total > 0 ? round(($positive / $total) * 100, 1) : 0,
                    'neutral_percent' => $total > 0 ? round(($neutral / $total) * 100, 1) : 0,
                    'negative_percent' => $total > 0 ? round(($negative / $total) * 100, 1) : 0,
                    'trend' => $chartData,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SentimentDashboardController@dashboard: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت داده‌ها'], 500);
        }
    }

    /**
     * فروشندگان برتر بر اساس امتیاز احساسات
     */
    public function topSellers()
    {
        try {
            $sellersWithScore = DB::table('users')
                ->select('users.id', 'users.name', 'users.shop_name', 'users.avatar')
                ->selectSub(function ($query) {
                    $query->selectRaw('AVG(ms.score)')
                        ->from('conversations as c')
                        ->join('message_sentiments as ms', 'ms.conversation_id', '=', 'c.id')
                        ->whereColumn('c.seller_id', 'users.id');
                }, 'avg_score')
                ->selectSub(function ($query) {
                    $query->selectRaw('COUNT(*)')
                        ->from('conversations')
                        ->whereColumn('conversations.seller_id', 'users.id');
                }, 'conversations_count')
                ->where('users.role', 'seller')
                ->having('avg_score', '>', 0)
                ->orderByDesc('avg_score')
                ->limit(10)
                ->get()
                ->map(function ($seller) {
                    $score = (float) $seller->avg_score;
                    return [
                        'id' => $seller->id,
                        'name' => $seller->name,
                        'shop_name' => $seller->shop_name,
                        'avatar' => $seller->avatar,
                        'conversations_count' => (int) $seller->conversations_count,
                        'score' => round($score, 3),
                        'sentiment' => $score > 0.1 ? 'positive' : ($score < -0.1 ? 'negative' : 'neutral'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $sellersWithScore,
            ]);
        } catch (\Exception $e) {
            Log::error('SentimentDashboardController@topSellers: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'خطا: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * هشدارهای احساسات منفی
     */
    public function alerts()
    {
        try {
            $alerts = DB::table('conversations')
                ->select(
                    'conversations.id',
                    'conversations.created_at',
                    'b.name as buyer_name',
                    's.name as seller_name',
                    'p.name as product_name'
                )
                ->selectSub(function ($query) {
                    $query->selectRaw('AVG(score)')
                        ->from('message_sentiments')
                        ->whereColumn('conversation_id', 'conversations.id');
                }, 'avg_score')
                ->leftJoin('users as b', 'b.id', '=', 'conversations.buyer_id')
                ->leftJoin('users as s', 's.id', '=', 'conversations.seller_id')
                ->leftJoin('products as p', 'p.id', '=', 'conversations.product_id')
                ->where('conversations.is_active', true)
                ->having('avg_score', '<', -0.1)
                ->orderBy('avg_score')
                ->limit(10)
                ->get()
                ->map(function ($conv) {
                    return [
                        'id' => $conv->id,
                        'buyer_name' => $conv->buyer_name ?? 'ناشناس',
                        'seller_name' => $conv->seller_name ?? 'ناشناس',
                        'product_name' => $conv->product_name ?? '-',
                        'avg_score' => round((float) $conv->avg_score, 3),
                        'created_at' => \Carbon\Carbon::parse($conv->created_at)->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $alerts,
            ]);
        } catch (\Exception $e) {
            Log::error('SentimentDashboardController@alerts: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'خطا: ' . $e->getMessage()
            ], 500);
        }
    }
}