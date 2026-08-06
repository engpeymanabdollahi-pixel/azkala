<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SellerRequest;
use App\Services\SellerRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerRequestController extends Controller
{
    protected SellerRequestService $sellerRequestService;

    public function __construct(SellerRequestService $sellerRequestService)
    {
        $this->sellerRequestService = $sellerRequestService;
    }

    /**
     * مرحله ۱: ثبت درخواست اولیه (همان روت store قدیمی که با فیلدهای جدید سازگار شد)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // 🛡️ لایه امنیتی ۱: جلوگیری از تغییر نقش ادمین اصلی
        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'مدیران سیستم نمی‌توانند درخواست فروشندگی ثبت کنند. لطفاً برای فعالیت فروشندگی از یک حساب کاربری جداگانه استفاده کنید.'
            ], 403);
        }
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'national_code' => 'required|string|size:10',
            'phone' => 'required|string|max:11',
            'proposed_shop_name' => 'nullable|string|max:255',
        ]);

        try {
            if ($this->sellerRequestService->findActiveRequest($user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما قبلاً درخواست فروشندگی ثبت کرده‌اید و در حال بررسی است.'
                ], 400);
            }

            $sellerRequest = $this->sellerRequestService->submitInitialRequest($user, $validated);

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
            Log::error('SellerRequest Store Error: ' . $e->getMessage());
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
        $request = $this->sellerRequestService->getLatestRequest(auth()->id());

        if (!$request) {
            return response()->json(null); // درخواستی وجود ندارد
        }

        return response()->json([
            'id' => $request->id,
            'status' => $request->status,
            'proposed_shop_name' => $request->shop_name,
            'bank_account' => $request->bank_account, // اگر پر باشد یعنی مرحله ۲ هم رد شده
            // ✅ اضافه شد — بدون این، SellerRequestPage.tsx/ProfileSection.tsx
            // برای درخواست رد‌شده دلیل رد را می‌خواستند نشان دهند ولی
            // requestData?.rejection_reason همیشه undefined بود چون بک‌اند
            // اصلاً آن را برنمی‌گرداند، با اینکه واقعاً در دیتابیس ذخیره شده.
            'rejection_reason' => $request->rejection_reason,
        ]);
    }

    // ✅ complete() (مرحله‌ی «تکمیل اطلاعات پس از تایید ادمین») اینجا بود،
    // مربوط به یک نسخه‌ی قدیمی‌تر و ساده‌تر (۲مرحله‌ای) از این قابلیت که با
    // جریان فعلی ۴مرحله‌ای (initial-approve → upload-documents → final-approve)
    // جایگزین شده. هیچ‌جای SellerRequestPage.tsx این endpoint را صدا
    // نمی‌زد — تا وقتی هم صدا زده می‌شد، shop_alias/bank_name را می‌گرفت ولی
    // چون این ستون‌ها اصلاً روی seller_requests نبودند (پیش از مایگریشن
    // add_bank_name_and_shop_alias)، بی‌صدا گم می‌شدند. finalApproveRequest
    // الان همان کار (کپی shop_name/bank_name/bank_account/اسلاگ به User) را
    // در نقطه‌ی درست از جریان واقعی انجام می‌دهد.

    /**
     * مرحله ۳: آپلود مدارک توسط فروشنده
     */
    public function uploadDocuments(Request $request, SellerRequest $sellerRequest)
    {
        try {
            // ۱. بررسی امنیت
            if ($sellerRequest->user_id !== auth()->id()) {
                return response()->json(['success' => false, 'message' => 'دسترسی غیرمجاز'], 403);
            }

            // ۲. بررسی وضعیت
            if ($sellerRequest->status !== 'pending_documents') {
                return response()->json([
                    'success' => false,
                    'message' => 'وضعیت فعلی اجازه آپلود نمی‌دهد: ' . $sellerRequest->status
                ], 400);
            }

            // ۳. اعتبارسنجی (حجم تا ۵ مگابایت افزایش یافت برای جلوگیری از خطاهای پنهان)
            // ✅ bank_name و shop_alias اضافه شدند — قبلاً هیچ‌جای جریان
            // فعلی این دو را از فروشنده نمی‌پرسید.
            $validated = $request->validate([
                'id_card_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
                'business_license_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
                'bank_account' => 'required|string|min:10',
                'bank_name' => 'nullable|string|max:100',
                'shop_alias' => 'nullable|string|regex:/^[a-z0-9-]*$/|max:50',
            ]);

            // ۴. ذخیره‌سازی فایل‌ها و به‌روزرسانی دیتابیس
            $this->sellerRequestService->uploadDocuments(
                $sellerRequest,
                $validated,
                $request->file('id_card_image'),
                $request->file('business_license_image')
            );

            return response()->json([
                'success' => true,
                'message' => 'مدارک با موفقیت بارگذاری شد و در انتظار بررسی نهایی است.',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // لاگ کردن دقیق خطای ولیدیشن برای دیباگ
            Log::error('Validation Error in uploadDocuments: ', $e->errors());
            throw $e; // لاراول خودکار پاسخ ۴۲۲ را برمی‌گرداند
        } catch (\Exception $e) {
            Log::error('Critical Error in uploadDocuments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطای داخلی سرور: ' . $e->getMessage()
            ], 500);
        }
    }
}