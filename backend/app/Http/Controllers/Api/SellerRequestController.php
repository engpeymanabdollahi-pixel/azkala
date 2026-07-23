<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SellerRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerRequestController extends Controller
{
    /**
     * مرحله ۱: ثبت درخواست اولیه (همان روت store قدیمی که با فیلدهای جدید سازگار شد)
     */
        public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'national_code' => 'required|string|size:10',
            'phone' => 'required|string|max:11',
            'proposed_shop_name' => 'nullable|string|max:255',
        ]);

        try {
            $userId = auth()->id();

            // ۱. بررسی درخواست تکراری
            $existingRequest = \App\Models\SellerRequest::where('user_id', $userId)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما قبلاً درخواست فروشندگی ثبت کرده‌اید و در حال بررسی است.'
                ], 400);
            }

            // ۲. به‌روزرسانی نام کاربر در جدول users
            $request->user()->update([
                'name' => $validated['full_name'],
                'national_code' => $validated['national_code'],
                'phone' => $validated['phone'],
                'role' => 'pending_seller',
            ]);

            // ۳. ایجاد رکورد در seller_requests (با نگاشت صحیح نام ستون‌ها)
            $sellerRequest = \App\Models\SellerRequest::create([
                'user_id' => $userId,
                // نگاشت proposed_shop_name به shop_name موجود در دیتابیس
                'shop_name' => $validated['proposed_shop_name'] ?: ('فروشگاه ' . $validated['full_name']),
                'national_code' => $validated['national_code'],
                'phone' => $validated['phone'],
                'description' => 'درخواست ثبت شده از فرم جدید', // مقدار پیش‌فرض برای ستون description
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'درخواست اولیه شما با موفقیت ثبت شد و در انتظار تأیید ادمین است.',
                'data' => $sellerRequest
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطای اعتبارسنجی',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SellerRequest Store Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطای سرور در ثبت درخواست: ' . $e->getMessage() // نمایش خطای دقیق برای دیباگ
            ], 500);
        }
    }

    /**
     * دریافت وضعیت درخواست کاربر (برای اینکه فرانت‌اند بداند کدام فرم را نشان دهد)
     */
    public function getStatus()
    {
        $userId = auth()->id();
        $request = SellerRequest::where('user_id', $userId)->latest()->first();

        if (!$request) {
            return response()->json(null); // درخواستی وجود ندارد
        }

        return response()->json([
            'id' => $request->id,
            'status' => $request->status,
            'proposed_shop_name' => $request->shop_name,
            'bank_account' => $request->bank_account, // اگر پر باشد یعنی مرحله ۲ هم رد شده
        ]);
    }

    /**
     * مرحله ۲: تکمیل اطلاعات پس از تأیید ادمین
     */
    public function complete(Request $request, SellerRequest $sellerRequest)
    {
        // امنیت: اطمینان از اینکه کاربر فقط درخواست خودش را تکمیل می‌کند
        if ($sellerRequest->user_id !== auth()->id()) {
            return response()->json(['success' => false, 'message' => 'دسترسی غیرمجاز'], 403);
        }

        if ($sellerRequest->status !== 'approved') {
            return response()->json(['success' => false, 'message' => 'درخواست شما هنوز توسط ادمین تأیید نشده است.'], 400);
        }

        $validated = $request->validate([
            'shop_name' => 'required|string|max:255',
            'shop_alias' => 'nullable|string|regex:/^[a-z0-9-]*$/|max:50',
            'bank_name' => 'required|string|max:100',
            'bank_account' => 'required|string|min:10',
            'accept_terms' => 'accepted',
        ]);

        try {
            $sellerRequest->update([
                'shop_name' => $validated['shop_name'],
                'shop_alias' => $validated['shop_alias'] ?? null,
                'bank_name' => $validated['bank_name'],
                'bank_account' => $validated['bank_account'],
            ]);

            // ارتقای قطعی نقش کاربر به فروشنده
            $request->user()->update(['role' => 'seller']);

            return response()->json([
                'success' => true,
                'message' => 'تبریک! شعبه آنلاین شما با موفقیت افتتاح و فعال شد.',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'خطای اعتبارسنجی', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('SellerRequest Complete Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطای سرور در تکمیل اطلاعات.'], 500);
        }
    }
}