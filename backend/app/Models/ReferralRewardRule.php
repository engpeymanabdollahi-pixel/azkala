<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * یک قانون پاداش سطحی (milestone) — Referral Rule Engine (Part 4 audit).
 * رجوع به کامنت migration برای معماری کامل.
 */
class ReferralRewardRule extends Model
{
    use SoftDeletes;

    public const TYPE_FIXED_CREDIT = 'fixed_credit';

    public const TYPE_FIXED_COUPON = 'fixed_coupon';

    public const TYPE_PERCENTAGE_COUPON = 'percentage_coupon';

    protected $fillable = [
        'milestone',
        'reward_type',
        'reward_value',
        'min_order_amount',
        'max_discount',
        'coupon_expiration_days',
        'usage_limit',
        'repeatable',
        'priority',
        'is_active',
        'start_date',
        'end_date',
        'description',
    ];

    protected $casts = [
        'milestone' => 'integer',
        'reward_value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'coupon_expiration_days' => 'integer',
        'usage_limit' => 'integer',
        'repeatable' => 'boolean',
        'priority' => 'integer',
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function triggers(): HasMany
    {
        return $this->hasMany(ReferralRuleTrigger::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * فعال + در بازه‌ی تاریخی معتبر — همان الگوی Coupon::scopeValid.
     */
    public function scopeValid($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            });
    }

    /**
     * آیا با تعداد فعلی معرفی موفق، این قانون *الان* واجد شرایط trigger
     * شدن است؟ (بدون توجه به این‌که قبلاً trigger شده یا نه — آن چک
     * جداگانه‌ در ReferralRuleEngineService با جدول triggers است.)
     */
    public function isEligibleFor(int $successfulReferralsCount): bool
    {
        if ($successfulReferralsCount < $this->milestone) {
            return false;
        }

        if (! $this->repeatable) {
            return $successfulReferralsCount === $this->milestone;
        }

        // تکرارشونده: هر مضرب دقیق milestone یک firing جدید است
        // («هر ۱۰ معرفی یک‌بار» → در ۱۰، ۲۰، ۳۰، ...).
        return $this->milestone > 0 && $successfulReferralsCount % $this->milestone === 0;
    }
}
