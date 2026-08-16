<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * لجر پاداش معرفی — Referral System Phase 3 (Reward Ledger).
 *
 * هر ردیف یعنی «این Referral دقیقاً یک‌بار پاداش گرفت» — نه یک کیف پول
 * قابل‌خرج‌کردن. رجوع به کامنت migration برای معماری کامل (چرا مستقل از
 * seller_transactions/wallet_balance است) و ReferralRewardService برای
 * منطق ساخت idempotent این ردیف‌ها.
 */
class ReferralReward extends Model
{
    public const TYPE_FIXED_CREDIT = 'fixed_credit';

    public const STATUS_GRANTED = 'granted';

    public const STATUS_REVERSED = 'reversed';

    protected $fillable = [
        'referral_id',
        'referrer_user_id',
        'order_id',
        'amount',
        'type',
        'status',
        'rewarded_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'rewarded_at' => 'datetime',
    ];

    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
