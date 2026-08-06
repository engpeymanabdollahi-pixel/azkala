<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductSuggestion;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SuggestionManagementController extends Controller
{
    /**
     * آمار کلی پیشنهادات
     */
    public function stats()
    {
        try {
            $totalSuggestions = ProductSuggestion::count();
            $clickedSuggestions = ProductSuggestion::where('is_clicked', true)->count();
            $purchasedSuggestions = ProductSuggestion::where('is_purchased', true)->count();
            $autoSuggestions = ProductSuggestion::where('source', 'auto')->count();
            $manualSuggestions = ProductSuggestion::where('source', 'manual')->count();

            // محاسبه نرخ‌ها
            $clickRate = $totalSuggestions > 0
                ? round(($clickedSuggestions / $totalSuggestions) * 100, 1)
                : 0;
            $conversionRate = $clickedSuggestions > 0
                ? round(($purchasedSuggestions / $clickedSuggestions) * 100, 1)
                : 0;

            // درآمد از پیشنهادات (مجموع قیمت محصولات خریداری شده)
            $revenue = ProductSuggestion::where('is_purchased', true)
                ->join('products', 'products.id', '=', 'product_suggestions.product_id')
                ->sum('products.price');

            // پیشنهادات امروز
            $todaySuggestions = ProductSuggestion::whereDate('created_at', today())->count();

            // روند ۷ روز اخیر
            $trend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $count = ProductSuggestion::whereDate('created_at', $date)->count();
                $clicked = ProductSuggestion::whereDate('created_at', $date)
                    ->where('is_clicked', true)->count();
                $purchased = ProductSuggestion::whereDate('created_at', $date)
                    ->where('is_purchased', true)->count();

                $trend[] = [
                    'date' => now()->subDays($i)->locale('fa')->isoFormat('D MMM'),
                    'total' => $count,
                    'clicked' => $clicked,
                    'purchased' => $purchased,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalSuggestions,
                    'clicked' => $clickedSuggestions,
                    'purchased' => $purchasedSuggestions,
                    'auto' => $autoSuggestions,
                    'manual' => $manualSuggestions,
                    'click_rate' => $clickRate,
                    'conversion_rate' => $conversionRate,
                    'revenue' => $revenue,
                    'today' => $todaySuggestions,
                    'trend' => $trend,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SuggestionManagementController@stats: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار',
            ], 500);
        }
    }

    /**
     * لیست پیشنهادات با فیلتر
     */
    public function index(Request $request)
    {
        try {
            $query = ProductSuggestion::with([
                'product:id,name,main_image,price,discount_price',
                'suggestedBy:id,name,shop_name',
                'conversation:id,buyer_id,seller_id',
            ]);

            // فیلتر بر اساس منبع
            if ($request->filled('source') && $request->source !== 'all') {
                $query->where('source', $request->source);
            }

            // فیلتر بر اساس وضعیت کلیک
            if ($request->filled('clicked') && $request->clicked !== 'all') {
                $query->where('is_clicked', $request->clicked === 'yes');
            }

            // فیلتر بر اساس وضعیت خرید
            if ($request->filled('purchased') && $request->purchased !== 'all') {
                $query->where('is_purchased', $request->purchased === 'yes');
            }

            // فیلتر بر اساس فروشنده
            if ($request->filled('seller_id')) {
                $query->where('suggested_by', $request->seller_id);
            }

            // فیلتر بر اساس تاریخ
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            $suggestions = $query->orderByDesc('created_at')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => [
                    'suggestions' => $suggestions->items(),
                    'pagination' => [
                        'current_page' => $suggestions->currentPage(),
                        'last_page' => $suggestions->lastPage(),
                        'per_page' => $suggestions->perPage(),
                        'total' => $suggestions->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SuggestionManagementController@index: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت لیست پیشنهادات',
            ], 500);
        }
    }

    /**
     * بهترین پیشنهادات (بر اساس نرخ تبدیل)
     */
    public function topPerformers()
    {
        try {
            $topProducts = ProductSuggestion::select('product_id')
                ->selectRaw('COUNT(*) as total_suggestions')
                ->selectRaw('SUM(is_clicked) as total_clicked')
                ->selectRaw('SUM(is_purchased) as total_purchased')
                ->with('product:id,name,main_image,price,discount_price,sales_count')
                ->groupBy('product_id')
                ->having('total_suggestions', '>=', 5) // حداقل ۵ پیشنهاد
                ->orderByDesc('total_purchased')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $conversionRate = $item->total_clicked > 0
                        ? round(($item->total_purchased / $item->total_clicked) * 100, 1)
                        : 0;
                    $clickRate = $item->total_suggestions > 0
                        ? round(($item->total_clicked / $item->total_suggestions) * 100, 1)
                        : 0;

                    return [
                        'product_id' => $item->product_id,
                        'product' => $item->product,
                        'total_suggestions' => $item->total_suggestions,
                        'total_clicked' => $item->total_clicked,
                        'total_purchased' => $item->total_purchased,
                        'click_rate' => $clickRate,
                        'conversion_rate' => $conversionRate,
                        'revenue' => ($item->product?->discount_price ?? $item->product?->price ?? 0) * $item->total_purchased,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $topProducts,
            ]);
        } catch (\Exception $e) {
            Log::error('SuggestionManagementController@topPerformers: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * فروشندگان برتر (بر اساس تعداد پیشنهادات موفق)
     */
    public function topSellers()
    {
        try {
            $topSellers = ProductSuggestion::select('suggested_by')
                ->selectRaw('COUNT(*) as total_suggestions')
                ->selectRaw('SUM(is_clicked) as total_clicked')
                ->selectRaw('SUM(is_purchased) as total_purchased')
                ->with('suggestedBy:id,name,shop_name,avatar')
                ->whereNotNull('suggested_by')
                ->groupBy('suggested_by')
                ->having('total_suggestions', '>=', 3)
                ->orderByDesc('total_purchased')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'seller' => $item->suggestedBy,
                        'total_suggestions' => $item->total_suggestions,
                        'total_clicked' => $item->total_clicked,
                        'total_purchased' => $item->total_purchased,
                        'success_rate' => $item->total_suggestions > 0
                            ? round(($item->total_purchased / $item->total_suggestions) * 100, 1)
                            : 0,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $topSellers,
            ]);
        } catch (\Exception $e) {
            Log::error('SuggestionManagementController@topSellers: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * تنظیمات الگوریتم پیشنهاد
     */
    public function getSettings()
    {
        try {
            // ✅ قبلاً این متد همیشه همین مقادیر پیش‌فرض ثابت را برمی‌گرداند و
            // هیچ‌وقت از جدول settings نمی‌خواند — یعنی با اینکه updateSettings()
            // مقادیر را با کلید suggestion_{key} واقعاً ذخیره می‌کرد، ادمین بعد
            // از رفرش صفحه همیشه همان تنظیمات پیش‌فرض اولیه را می‌دید و تصور
            // می‌کرد ذخیره کار نکرده است.
            $defaults = [
                'max_suggestions_per_conversation' => 5,
                'min_relevance_score' => 0.5,
                'prioritize_same_category' => true,
                'prioritize_top_selling' => true,
                'prioritize_new_products' => false,
                'auto_suggest_enabled' => true,
                'manual_suggest_enabled' => true,
            ];

            $booleanKeys = [
                'prioritize_same_category',
                'prioritize_top_selling',
                'prioritize_new_products',
                'auto_suggest_enabled',
                'manual_suggest_enabled',
            ];

            $settings = [];
            foreach ($defaults as $key => $default) {
                $stored = Setting::where('key', "suggestion_{$key}")->value('value');

                if ($stored === null) {
                    $settings[$key] = $default;
                } elseif (in_array($key, $booleanKeys, true)) {
                    $settings[$key] = filter_var($stored, FILTER_VALIDATE_BOOLEAN);
                } elseif ($key === 'max_suggestions_per_conversation') {
                    $settings[$key] = (int) $stored;
                } elseif ($key === 'min_relevance_score') {
                    $settings[$key] = (float) $stored;
                } else {
                    $settings[$key] = $stored;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('SuggestionManagementController@getSettings: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * بروزرسانی تنظیمات الگوریتم
     */
    public function updateSettings(Request $request)
    {
        try {
            $validated = $request->validate([
                'max_suggestions_per_conversation' => 'integer|min:1|max:10',
                'min_relevance_score' => 'numeric|min:0|max:1',
                'prioritize_same_category' => 'boolean',
                'prioritize_top_selling' => 'boolean',
                'prioritize_new_products' => 'boolean',
                'auto_suggest_enabled' => 'boolean',
                'manual_suggest_enabled' => 'boolean',
            ]);

            // ذخیره در جدول settings
            foreach ($validated as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => "suggestion_{$key}"],
                    ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'تنظیمات بروزرسانی شد',
            ]);
        } catch (ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('SuggestionManagementController@updateSettings: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }
}
