<?php

namespace App\Services\Admin;

use App\Models\Referral;
use App\Models\ReferralReward;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * لایه‌ی مدیریتی روی سیستم Referral — Phase 3 (MVP: فقط نمایش/ممیزی،
 * بدون ویرایش/ابطال پاداش — رجوع به کامنت AdminReferralController).
 *
 * دقیقاً هم‌الگو با AdminStoreService: یک لایه‌ی نازک روی مدل‌ها، بدون
 * authorization موازی (middleware استاندارد permission: در
 * routes/api.php این را enforce می‌کند).
 */
class AdminReferralService
{
    public function list(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        $query = Referral::query()
            ->with(['referrer:id,name,phone', 'referred:id,name,phone', 'reward:id,referral_id,amount,rewarded_at,order_id', 'reward.order:id,order_number']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // ✅ reward_status: فیلتر مکمل status — «فقط آن‌هایی که واقعاً
        // پاداش گرفته‌اند» با دقت بیشتر از status=rewarded (که فعلاً
        // معادل است، ولی این فیلتر مستقل نگه داشته می‌شود تا اگر در
        // آینده status های بیشتری معنای «rewarded» پیدا کردند، این فیلتر
        // هنوز درست کار کند).
        if (($filters['reward_status'] ?? null) === 'rewarded') {
            $query->whereHas('reward');
        } elseif (($filters['reward_status'] ?? null) === 'not_rewarded') {
            $query->whereDoesntHave('reward');
        }

        // ✅ جستجوی معرف/کاربر معرفی‌شده — فقط روی نام (نه شماره موبایل
        // مستقیم در query string لاگ‌شونده‌ی سرور، طبق همان احتیاط
        // حریم خصوصی که بقیه‌ی جستجوهای ادمین این پروژه دارند).
        if (! empty($filters['referrer_search'])) {
            $search = $filters['referrer_search'];
            $query->whereHas('referrer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if (! empty($filters['referred_search'])) {
            $search = $filters['referred_search'];
            $query->whereHas('referred', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('registered_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('registered_at', '<=', $filters['date_to']);
        }

        return $query->orderByDesc('registered_at')->paginate($perPage);
    }

    public function detail(int $referralId): Referral
    {
        return Referral::with([
            'referrer:id,name,phone',
            'referred:id,name,phone',
            'reward:id,referral_id,amount,type,status,rewarded_at,order_id',
            'reward.order:id,order_number,status',
        ])->findOrFail($referralId);
    }

    /**
     * آمار خلاصه‌ی Overview (بخش ۱۰ درخواست).
     */
    public function summary(): array
    {
        $counts = Referral::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'total_referrals' => (int) $counts->sum(),
            'pending' => (int) ($counts[Referral::STATUS_PENDING] ?? 0),
            'qualified' => (int) ($counts[Referral::STATUS_QUALIFIED] ?? 0),
            'rewarded' => (int) ($counts[Referral::STATUS_REWARDED] ?? 0),
            'cancelled' => (int) ($counts[Referral::STATUS_CANCELLED] ?? 0),
            'rejected' => (int) ($counts[Referral::STATUS_REJECTED] ?? 0),
            'total_reward_amount' => (float) ReferralReward::where('status', ReferralReward::STATUS_GRANTED)->sum('amount'),
        ];
    }
}
