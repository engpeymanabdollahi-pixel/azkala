<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MessageTemplateController extends Controller
{
    /**
     * لیست قالب‌ها
     */
    public function index(Request $request)
    {
        try {
            $query = MessageTemplate::query();

            // فیلتر بر اساس دسته‌بندی
            if ($request->filled('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // فیلتر بر اساس وضعیت
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('is_active', $request->status === 'active');
            }

            // جستجو
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            $templates = $query->orderByDesc('priority')
                ->orderByDesc('usage_count')
                ->paginate(20);

            // آمار کلی
            $stats = [
                'total' => MessageTemplate::count(),
                'active' => MessageTemplate::where('is_active', true)->count(),
                'inactive' => MessageTemplate::where('is_active', false)->count(),
                'system' => MessageTemplate::where('is_system', true)->count(),
                'total_usage' => MessageTemplate::sum('usage_count'),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'templates' => $templates->items(),
                    'pagination' => [
                        'current_page' => $templates->currentPage(),
                        'last_page' => $templates->lastPage(),
                        'per_page' => $templates->perPage(),
                        'total' => $templates->total(),
                    ],
                    'stats' => $stats,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('MessageTemplateController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت قالب‌ها',
            ], 500);
        }
    }

    /**
     * ساخت قالب جدید
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:200',
                'content' => 'required|string|max:5000',
                'category' => 'required|in:general,shipping,payment,product,returns,greeting,farewell',
                'icon' => 'nullable|string|max:50',
                'priority' => 'integer|min:0|max:100',
            ]);

            // استخراج متغیرها از محتوا
            preg_match_all('/\{([^}]+)\}/', $validated['content'], $matches);
            $variables = array_unique($matches[1] ?? []);

            $template = MessageTemplate::create([
                'title' => $validated['title'],
                'content' => $validated['content'],
                'category' => $validated['category'],
                'icon' => $validated['icon'] ?? null,
                'priority' => $validated['priority'] ?? 0,
                'is_active' => true,
                'is_system' => false,
                'variables' => $variables,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'قالب با موفقیت ساخته شد',
                'data' => $template,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('MessageTemplateController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ساخت قالب',
            ], 500);
        }
    }

    /**
     * بروزرسانی قالب
     */
    public function update(Request $request, $id)
    {
        try {
            $template = MessageTemplate::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:200',
                'content' => 'sometimes|string|max:5000',
                'category' => 'sometimes|in:general,shipping,payment,product,returns,greeting,farewell',
                'icon' => 'nullable|string|max:50',
                'priority' => 'sometimes|integer|min:0|max:100',
                'is_active' => 'sometimes|boolean',
            ]);

            // استخراج متغیرها از محتوا
            if (isset($validated['content'])) {
                preg_match_all('/\{([^}]+)\}/', $validated['content'], $matches);
                $validated['variables'] = array_unique($matches[1] ?? []);
            }

            $template->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'قالب بروزرسانی شد',
                'data' => $template,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('MessageTemplateController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بروزرسانی',
            ], 500);
        }
    }

    /**
     * حذف قالب
     */
    public function destroy($id)
    {
        try {
            $template = MessageTemplate::findOrFail($id);

            if ($template->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'قالب‌های سیستمی قابل حذف نیستند',
                ], 403);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'قالب حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('MessageTemplateController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف',
            ], 500);
        }
    }

    /**
     * فعال/غیرفعال کردن قالب
     */
    public function toggle($id)
    {
        try {
            $template = MessageTemplate::findOrFail($id);
            $template->update(['is_active' => !$template->is_active]);

            return response()->json([
                'success' => true,
                'message' => $template->is_active ? 'قالب فعال شد' : 'قالب غیرفعال شد',
                'data' => $template,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * ثبت استفاده از قالب
     */
    public function trackUsage($id)
    {
        try {
            $template = MessageTemplate::findOrFail($id);
            $template->incrementUsage();

            return response()->json([
                'success' => true,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
            ], 500);
        }
    }

    /**
     * Seed قالب‌های پیش‌فرض
     */
    public function seedDefaults()
    {
        try {
            $templates = [
                [
                    'title' => 'خوش‌آمدگویی',
                    'content' => 'سلام {buyer_name} عزیز! 👋\nخوش آمدید به فروشگاه {shop_name}.\nچطور می‌توانم کمکتان کنم؟',
                    'category' => 'greeting',
                    'icon' => '👋',
                    'is_system' => true,
                    'priority' => 100,
                ],
                [
                    'title' => 'اطلاعات محصول',
                    'content' => 'محصول {product_name} موجود است.\n💰 قیمت: {price} تومان\n📦 ارسال: {shipping_info}\n\nسوال دیگری دارید؟',
                    'category' => 'product',
                    'icon' => '📦',
                    'is_system' => true,
                    'priority' => 90,
                ],
                [
                    'title' => 'تایید سفارش',
                    'content' => '✅ سفارش شما با شماره {order_number} ثبت شد.\n\n📋 جزئیات:\n- مبلغ: {total_amount} تومان\n- وضعیت: در حال پردازش\n\nبه زودی ارسال می‌شود.',
                    'category' => 'shipping',
                    'icon' => '✅',
                    'is_system' => true,
                    'priority' => 85,
                ],
                [
                    'title' => 'اطلاعات ارسال',
                    'content' => '🚚 سفارش شما ارسال شد!\n\n📮 کد پیگیری: {tracking_code}\n📅 زمان تحویل: {delivery_date}\n\nمی‌توانید وضعیت را از پنل کاربری پیگیری کنید.',
                    'category' => 'shipping',
                    'icon' => '🚚',
                    'is_system' => true,
                    'priority' => 80,
                ],
                [
                    'title' => 'درخواست مرجوعی',
                    'content' => 'برای مرجوعی محصول لطفاً:\n\n1️⃣ دلیل مرجوعی را بفرمایید\n2️⃣ عکس محصول را ارسال کنید\n3️⃣ شماره سفارش: {order_number}\n\nپس از بررسی، راهنمایی می‌شوید.',
                    'category' => 'returns',
                    'icon' => '↩️',
                    'is_system' => true,
                    'priority' => 75,
                ],
                [
                    'title' => 'پرداخت ناموفق',
                    'content' => '❌ پرداخت شما ناموفق بود.\n\nدلایل احتمالی:\n- موجودی ناکافی\n- مشکل درگاه بانکی\n- انقضای کارت\n\nلطفاً مجدداً تلاش کنید یا از روش دیگری استفاده کنید.',
                    'category' => 'payment',
                    'icon' => '❌',
                    'is_system' => true,
                    'priority' => 70,
                ],
                [
                    'title' => 'کد تخفیف',
                    'content' => '🎁 کد تخفیف اختصاصی شما:\n\n💎 کد: {discount_code}\n📊 تخفیف: {discount_percent}%\n⏰ اعتبار تا: {expiry_date}\n\nاز خرید شما متشکریم!',
                    'category' => 'general',
                    'icon' => '🎁',
                    'is_system' => true,
                    'priority' => 65,
                ],
                [
                    'title' => 'خداحافظی',
                    'content' => 'ممنون از گفتگو با شما! 🙏\nاگر سوال دیگری داشتید، در خدمتیم.\n\nروز خوبی داشته باشید! 😊',
                    'category' => 'farewell',
                    'icon' => '👋',
                    'is_system' => true,
                    'priority' => 60,
                ],
            ];

            foreach ($templates as $template) {
                preg_match_all('/\{([^}]+)\}/', $template['content'], $matches);
                $template['variables'] = array_unique($matches[1] ?? []);
                $template['usage_count'] = 0;
                
                MessageTemplate::updateOrCreate(
                    ['title' => $template['title']],
                    $template
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'قالب‌های پیش‌فرض با موفقیت ایجاد شدند',
            ]);
        } catch (\Exception $e) {
            Log::error('MessageTemplateController@seedDefaults: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ایجاد قالب‌ها',
            ], 500);
        }
    }
}