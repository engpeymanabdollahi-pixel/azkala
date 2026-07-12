<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatFaq;
use App\Services\ChatFaqService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatFaqController extends Controller
{
    /**
     * لیست FAQ های فروشنده
     */
    public function index(Request $request)
    {
        try {
            $faqs = ChatFaq::where('seller_id', $request->user()->id)
                ->orderByDesc('priority')
                ->orderByDesc('usage_count')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $faqs,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatFaqController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت FAQ ها',
            ], 500);
        }
    }

    /**
     * ساخت FAQ جدید
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'question_pattern' => 'required|string|max:255',
                'answer' => 'required|string|max:1000',
                'category' => 'in:general,shipping,payment,product',
                'priority' => 'integer|min:0|max:100',
            ]);

            $faq = ChatFaq::create([
                'seller_id' => $request->user()->id,
                'question_pattern' => $validated['question_pattern'],
                'answer' => $validated['answer'],
                'category' => $validated['category'] ?? 'general',
                'priority' => $validated['priority'] ?? 0,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $faq,
            ], 201);
        } catch (\Exception $e) {
            Log::error('ChatFaqController@store: ' . $e->getMessage());
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
            $faq = ChatFaq::where('seller_id', $request->user()->id)->findOrFail($id);

            $validated = $request->validate([
                'question_pattern' => 'sometimes|string|max:255',
                'answer' => 'sometimes|string|max:1000',
                'category' => 'in:general,shipping,payment,product',
                'priority' => 'integer|min:0|max:100',
                'is_active' => 'boolean',
            ]);

            $faq->update($validated);

            return response()->json([
                'success' => true,
                'data' => $faq,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatFaqController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بروزرسانی FAQ',
            ], 500);
        }
    }

    /**
     * حذف FAQ
     */
    public function destroy(Request $request, $id)
    {
        try {
            $faq = ChatFaq::where('seller_id', $request->user()->id)->findOrFail($id);
            $faq->delete();

            return response()->json([
                'success' => true,
                'message' => 'FAQ حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('ChatFaqController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف FAQ',
            ], 500);
        }
    }

    /**
     * Seed FAQ های پیش‌فرض
     */
    public function seedDefaults(Request $request)
    {
        try {
            $sellerId = $request->user()->id;
            
            // بررسی وجود FAQ
            $exists = ChatFaq::where('seller_id', $sellerId)->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما قبلاً FAQ های پیش‌فرض دارید',
                ], 400);
            }

            $service = new ChatFaqService();
            $service->seedDefaultFaqs($sellerId);

            return response()->json([
                'success' => true,
                'message' => 'FAQ های پیش‌فرض اضافه شدند',
            ]);
        } catch (\Exception $e) {
            Log::error('ChatFaqController@seedDefaults: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در Seed FAQ',
            ], 500);
        }
    }
}