<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * یک ردیف = «این معرف در این تاریخ به این سطح رسید و این پاداش را
 * گرفت» — Referral Rule Engine (Part 4 audit). رجوع به کامنت migration.
 */
class ReferralRuleTrigger extends Model
{
    protected $fillable = [
        'referral_reward_rule_id',
        'referrer_user_id',
        'successful_referrals_count_at_trigger',
        'reward_type',
        'reward_value',
        'coupon_id',
    ];

    protected $casts = [
        'successful_referrals_count_at_trigger' => 'integer',
        'reward_value' => 'decimal:2',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ReferralRewardRule::class, 'referral_reward_rule_id');
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }
}
