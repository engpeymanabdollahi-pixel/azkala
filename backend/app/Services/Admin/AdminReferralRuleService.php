<?php

namespace App\Services\Admin;

use App\Models\ReferralRewardRule;
use App\Models\ReferralRuleTrigger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * CRUD قوانین پاداش سطحی معرفی — Referral Rule Engine (Part 4 audit).
 * همان الگوی نازکِ AdminCommissionController→service.
 */
class AdminReferralRuleService
{
    public function list(): Collection
    {
        return ReferralRewardRule::withCount('triggers')->orderBy('milestone')->get();
    }

    public function create(array $data): ReferralRewardRule
    {
        return ReferralRewardRule::create($data);
    }

    public function update(int $id, array $data): ReferralRewardRule
    {
        $rule = ReferralRewardRule::find($id);

        if (! $rule) {
            throw new ModelNotFoundException('قانون یافت نشد.');
        }

        $rule->update($data);

        return $rule->fresh();
    }

    public function delete(int $id): void
    {
        $rule = ReferralRewardRule::find($id);

        if (! $rule) {
            throw new ModelNotFoundException('قانون یافت نشد.');
        }

        // ✅ Soft delete — تاریخچه‌ی triggers قبلی (که به همین rule_id
        // اشاره می‌کنند) دست‌نخورده و قابل ممیزی می‌ماند، دقیقاً همان
        // فلسفه‌ی cascade محدودِ سایر جداول لجر این پروژه.
        $rule->delete();
    }

    public function toggleActive(int $id): ReferralRewardRule
    {
        $rule = ReferralRewardRule::find($id);

        if (! $rule) {
            throw new ModelNotFoundException('قانون یافت نشد.');
        }

        $rule->update(['is_active' => ! $rule->is_active]);

        return $rule->fresh();
    }

    /**
     * تاریخچه‌ی کامل trigger ها (برای پنل ادمین) — صفحه‌بندی‌شده،
     * جدیدترین اول.
     */
    public function triggerHistory(int $perPage = 20): LengthAwarePaginator
    {
        return ReferralRuleTrigger::with(['rule', 'referrer:id,name,phone', 'coupon:id,code'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function stats(): array
    {
        return [
            'total_rules' => ReferralRewardRule::count(),
            'active_rules' => ReferralRewardRule::where('is_active', true)->count(),
            'total_triggers' => ReferralRuleTrigger::count(),
            'coupons_issued' => ReferralRuleTrigger::whereNotNull('coupon_id')->count(),
        ];
    }
}
