<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Services\Referral\ReferralService;
use Illuminate\Http\Request;

/**
 * Referral System — Phase 2 (فقط GET؛ هیچ endpoint عمومی برای ساخت
 * Referral دلخواه اینجا نیست — capture فقط از داخل AuthService، سمت
 * سرور، هنگام ثبت‌نام واقعی انجام می‌شود).
 *
 * منطق Business در ReferralService است، نه اینجا — همان الگوی
 * AdminAccessController/AdminAccessService این پروژه.
 */
class ReferralController extends Controller
{
    public function __construct(protected ReferralService $service) {}

    /**
     * GET /user/referral — کد/لینک شخصی + آمار خلاصه‌ی کاربر جاری.
     * فقط برای request->user() — هیچ پارامتر id ای پذیرفته نمی‌شود، پس
     * امکان دیدن Referral کاربر دیگری از این مسیر اصلاً وجود ندارد.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->getReferralSummary($request->user()),
        ]);
    }

    /**
     * GET /user/referrals — لیست دعوت‌های خودِ کاربر جاری. عمداً فقط
     * status/تاریخ‌ها/اطلاعات پاداش برمی‌گردد؛ هیچ اطلاعات شخصی کاربر
     * معرفی‌شده (نام/شماره موبایل/ایمیل) نمایش داده نمی‌شود.
     *
     * ✅ Referral System Phase 3: qualified_at/rewarded_at/reward
     * (amount+order_number) اضافه شدند — reward با eager-load (رابطه‌ی
     * Referral::reward) خوانده می‌شود تا N+1 ایجاد نشود؛ order فقط
     * order_number برمی‌گرداند (شماره‌ی غیرحساس)، نه کل شیء سفارش.
     */
    public function myReferrals(Request $request)
    {
        $referrals = Referral::query()
            ->where('referrer_user_id', $request->user()->id)
            ->with('reward:id,referral_id,amount,rewarded_at,order_id', 'reward.order:id,order_number')
            ->orderByDesc('registered_at')
            ->get()
            ->map(fn (Referral $referral) => [
                'status' => $referral->status,
                'registered_at' => $referral->registered_at,
                'qualified_at' => $referral->qualified_at,
                'rewarded_at' => $referral->rewarded_at,
                'reward' => $referral->reward ? [
                    'amount' => (float) $referral->reward->amount,
                    'order_number' => $referral->reward->order?->order_number,
                ] : null,
            ]);

        return response()->json([
            'success' => true,
            'data' => $referrals,
        ]);
    }
}
