<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatFaq;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FaqManagementController extends Controller
{
    /**
     * لیست همه FAQ ها با فیلتر
     */
    public function index(Request $request)
    {
        try {
            $query = ChatFaq::with('seller:id,name,shop_name');

            // فیلتر بر اساس فروشنده
            if ($request->filled('seller_id')) {
                $query->where('seller_id', $request->seller_id);
            }

            // فیلتر بر اساس دسته‌بندی
            if ($request->filled('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // فیلتر بر اساس وضعیت
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('is_active', $request->status === 'active');
            }

            // فیلتر بر اساس نوع (سیستمی/فروشنده)
            if ($request->filled('type') && $request->type !== 'all') {
                if ($request->type === 'system') {
                    $query->whereNull('seller_id');
                } else {
                    $query->whereNotNull('seller_id');
                }
            }

            // جستجو
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('question_pattern', 'like', "%{$search}%")
                      ->orWhere('answer', 'like', "%{$search}%")
                      ->orWhereHas('seller', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }

            $faqs = $query->orderByDesc('priority')
                ->orderByDesc('created_at')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => [
                    'faqs' => $faqs->items(),
                    'pagination' => [
                        'current_page' => $faqs->currentPage(),
                        'last_page' => $faqs->lastPage(),
                        'per_page' => $faqs->perPage(),
                        'total' => $faqs->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('FaqManagementController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت لیست FAQ ها',
            ], 500);
        }
    }

    /**
     * آمار FAQ ها
     */
    public function stats()
    {
        try {
            $totalFaqs = ChatFaq::count();
            $activeFaqs = ChatFaq::where('is_active', true)->count();
            $inactiveFaqs = ChatFaq::where('is_active', false)->count();
            $systemFaqs = ChatFaq::whereNull('seller_id')->count();
            $sellerFaqs = ChatFaq::whereNotNull('seller_id')->count();
            $totalUsage = ChatFaq::sum('usage_count');

            // پراستفاده‌ترین FAQ ها
            $mostUsed = ChatFaq::with('seller:id,name,shop_name')
                ->orderByDesc('usage_count')
                ->limit(10)
                ->get()
                ->map(function ($faq) {
                    return [
                        'id' => $faq->id,
                        'question_pattern' => $faq->question_pattern,
                        'answer' => mb_substr($faq->answer, 0, 50),
                        'usage_count' => $faq->usage_count,
                        'seller_name' => $faq->seller?->name ?? 'سیستم',
                        'category' => $faq->category,
                    ];
                });

            // FAQ های بدون استفاده
            $unused = ChatFaq::with('seller:id,name,shop_name')
                ->where('usage_count', 0)
                ->limit(10)
                ->get()
                ->map(function ($faq) {
                    return [
                        'id' => $faq->id,
                        'question_pattern' => $faq->question_pattern,
                        'seller_name' => $faq->seller?->name ?? 'سیستم',
                        'created_at' => $faq->created_at->diffForHumans(),
                    ];
                });

            // آمار بر اساس دسته‌بندی
            $byCategory = ChatFaq::selectRaw('category, count(*) as count, sum(usage_count) as total_usage')
                ->groupBy('category')
                ->get()
                ->map(function ($item) {
                    return [
                        'category' => $item->category,
                        'count' => $item->count,
                        'total_usage' => $item->total_usage,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalFaqs,
                    'active' => $activeFaqs,
                    'inactive' => $inactiveFaqs,
                    'system' => $systemFaqs,
                    'seller' => $sellerFaqs,
                    'total_usage' => $totalUsage,
                    'most_used' => $mostUsed,
                    'unused' => $unused,
                    'by_category' => $byCategory,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('FaqManagementController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار',
            ], 500);
        }
    }

    /**
     * ساخت FAQ سیستمی (پیش‌فرض)
     */
    public function storeSystem(Request $request)
    {
        try {
            $validated = $request->validate([
                'question_pattern' => 'required|string|max:500',
                'answer' => 'required|string|max:2000',
                'category' => 'required|in:general,shipping,payment,product,returns',
                'priority' => 'integer|min:0|max:100',
            ]);

            $faq = ChatFaq::create([
                'seller_id' => null, // سیستمی
                'question_pattern' => $validated['question_pattern'],
                'answer' => $validated['answer'],
                'category' => $validated['category'],
                'priority' => $validated['priority'] ?? 0,
                'is_active' => true,
                'usage_count' => 0,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'FAQ سیستمی با موفقیت ساخته شد',
                'data' => $faq,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('FaqManagementController@storeSystem: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ساخت FAQ',
            ], 500);
        }
    }

    /**
     * بروزرسانی FAQ
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'question_pattern' => 'sometimes|string|max:500',
                'answer' => 'sometimes|string|max:2000',
                'category' => 'sometimes|in:general,shipping,payment,product,returns',
                'priority' => 'sometimes|integer|min:0|max:100',
                'is_active' => 'sometimes|boolean',
            ]);

            $faq = ChatFaq::findOrFail($id);
            $faq->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'FAQ بروزرسانی شد',
                'data' => $faq,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('FaqManagementController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بروزرسانی',
            ], 500);
        }
    }

    /**
     * حذف FAQ
     */
    public function destroy($id)
    {
        try {
            $faq = ChatFaq::findOrFail($id);
            $faq->delete();

            return response()->json([
                'success' => true,
                'message' => 'FAQ حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('FaqManagementController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف',
            ], 500);
        }
    }

    /**
     * فعال/غیرفعال کردن FAQ
     */
    public function toggle($id)
    {
        try {
            $faq = ChatFaq::findOrFail($id);
            $faq->update(['is_active' => !$faq->is_active]);

            return response()->json([
                'success' => true,
                'message' => $faq->is_active ? 'FAQ فعال شد' : 'FAQ غیرفعال شد',
                'data' => $faq,
            ]);
        } catch (\Exception $e) {
            Log::error('FaqManagementController@toggle: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }
}