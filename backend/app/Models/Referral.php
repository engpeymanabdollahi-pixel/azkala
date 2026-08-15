<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * یک رخداد «معرفی» (Referral System — Phase 2). رجوع به کامنت migration
 * برای توضیح اینکه چرا این یک جدول مستقل است، نه ستون‌های ساده روی users.
 */
class Referral extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_QUALIFIED = 'qualified';

    public const STATUS_REWARDED = 'rewarded';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'referrer_user_id',
        'referred_user_id',
        'referral_code',
        'status',
        'campaign_id',
        'registered_at',
        'qualified_at',
        'rewarded_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'qualified_at' => 'datetime',
        'rewarded_at' => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }
}
