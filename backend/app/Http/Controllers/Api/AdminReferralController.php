<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Services\Admin\AdminReferralService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

/**
 * مدیریت ادمین روی Referral — Phase 3 (MVP: صرفاً نمایش/ممیزی).
 *
 * ✅ طبق تصمیم صریح Phase 11 درخواست: «ویرایش/ابطال پاداش هنوز اضافه
 * نشود مگر اینکه یک الگوی تعدیل مالی امن و از قبل موجود باشد» — این
 * پروژه چنین الگویی برای Referral ندارد (رجوع به Audit)، پس این نسخه
 * فقط GET است؛ هیچ endpoint نوشتنی‌ای اینجا نیست.
 *
 * دسترسی از طریق middleware استاندارد permission: در routes/api.php
 * enforce می‌شود (referrals.view) — بدون هیچ authorization موازی،
 * دقیقاً هم‌الگو با AdminStoreController.
 */
class AdminReferralController extends Controller
{
    public function __construct(protected AdminReferralService $service) {}

    /**
     * GET /admin/referrals — لیست صفحه‌بندی‌شده + آمار خلاصه.
     */
    public function index(Request $request)
    {
        $filters = [
            'status' => $request->get('status'),
            'reward_status' => $request->get('reward_status'),
            'referrer_search' => $request->get('referrer_search'),
            'referred_search' => $request->get('referred_search'),
            'date_from' => $request->get('date_from'),
            'date_to' => $request->get('date_to'),
        ];

        $referrals = $this->service->list($filters, (int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'referrals' => $referrals->through(fn (Referral $referral) => $this->formatReferral($referral)),
                'pagination' => [
                    'current_page' => $referrals->currentPage(),
                    'last_page' => $referrals->lastPage(),
                    'per_page' => $referrals->perPage(),
                    'total' => $referrals->total(),
                ],
                'summary' => $this->service->summary(),
            ],
        ]);
    }

    /**
     * GET /admin/referrals/{referral} — جزئیات یک Referral.
     */
    public function show($id)
    {
        try {
            $referral = $this->service->detail((int) $id);

            return response()->json([
                'success' => true,
                'data' => $this->formatReferral($referral, detailed: true),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Referral یافت نشد.'], 404);
        }
    }

    /**
     * فقط فیلدهای غیرحساسِ لازم — بدون ایمیل/آدرس/سایر PII کاربران.
     */
    private function formatReferral(Referral $referral, bool $detailed = false): array
    {
        $base = [
            'id' => $referral->id,
            'referral_code' => $referral->referral_code,
            'status' => $referral->status,
            'referrer' => $referral->referrer ? [
                'id' => $referral->referrer->id,
                'name' => $referral->referrer->name,
            ] : null,
            'referred' => $referral->referred ? [
                'id' => $referral->referred->id,
                'name' => $referral->referred->name,
            ] : null,
            'registered_at' => $referral->registered_at,
            'qualified_at' => $referral->qualified_at,
            'rewarded_at' => $referral->rewarded_at,
            'reward' => $referral->reward ? [
                'amount' => (float) $referral->reward->amount,
                'type' => $referral->reward->type,
                'status' => $referral->reward->status,
                'rewarded_at' => $referral->reward->rewarded_at,
                'order_number' => $referral->reward->order?->order_number,
            ] : null,
        ];

        if ($detailed) {
            $base['qualifying_order'] = $referral->reward?->order ? [
                'id' => $referral->reward->order->id,
                'order_number' => $referral->reward->order->order_number,
                'status' => $referral->reward->order->status,
            ] : null;
        }

        return $base;
    }
}
