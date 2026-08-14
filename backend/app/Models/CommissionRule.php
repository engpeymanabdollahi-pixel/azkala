<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * قانون کمیسیون بر اساس بازه‌ی امتیاز عملکرد فروشنده.
 *
 * فقط توسط ادمین (از طریق AdminCommissionController) قابل تغییر است.
 * تغییر یک ردیف موجود فقط روی محاسبات *بعدی* اثر می‌گذارد — نرخی که قبلاً
 * روی seller_transactions ثبت شده (commission_rate/seller_level ستون‌های
 * audit) دست‌نخورده می‌ماند، چون آنجا یک کپیِ ثابت از نتیجه‌ی محاسبه ذخیره
 * شده، نه ارجاع زنده به این جدول.
 */
class CommissionRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'level',
        'label',
        'min_score',
        'max_score',
        'commission_rate',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'min_score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * قانونی که یک امتیاز مشخص را پوشش می‌دهد (فعال‌ترین/دقیق‌ترین بازه).
     * ترتیب بر اساس min_score نزولی است تا اگر بازه‌ها به‌اشتباه هم‌پوشانی
     * داشته باشند، بالاترین بازه‌ی مطابق (سخاوتمندانه‌ترین تفسیر برای
     * فروشنده) انتخاب شود، نه اولین ردیف دلخواه در دیتابیس.
     */
    public static function forScore(float $score): ?self
    {
        return static::query()
            ->where('is_active', true)
            ->where('min_score', '<=', $score)
            ->where(function ($q) use ($score) {
                $q->whereNull('max_score')->orWhere('max_score', '>=', $score);
            })
            ->orderByDesc('min_score')
            ->first();
    }
}
