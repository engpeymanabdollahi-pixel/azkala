<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ این خط را اضافه کنید
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Coupon extends Model
{
    use SoftDeletes;
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_amount',
        'max_discount',
        'usage_limit',
        'usage_limit_per_user',
        'used_count',
        'start_date',
        'end_date',
        'is_active',
        'description',
        'applicable_to',
        'applicable_ids',
        'created_by',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'usage_limit_per_user' => 'integer',
        'used_count' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'applicable_ids' => 'array',
    ];

    // ==================== Relationships ====================

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'coupon_user')
                    ->withPivot('order_id', 'discount_amount')
                    ->withTimestamps();
    }

    // ==================== Scopes ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeValid($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('start_date')
                  ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', now());
            });
    }

    // ==================== Methods ====================

    /**
     * بررسی اعتبار کامل کوپن
     */
    public function isValidFor(int $userId, float $subtotal, array $productIds = []): array
    {
        try {
            // ۱. فعال بودن
            if (!$this->is_active) {
                return ['valid' => false, 'message' => 'این کد تخفیف غیرفعال است'];
            }

            // ۲. تاریخ شروع
            if ($this->start_date && $this->start_date->isFuture()) {
                return ['valid' => false, 'message' => 'این کد تخفیف هنوز فعال نشده است'];
            }

            // ۳. تاریخ پایان
            if ($this->end_date && $this->end_date->isPast()) {
                return ['valid' => false, 'message' => 'اعتبار این کد تخفیف به پایان رسیده است'];
            }

            // ۴. محدودیت کلی
            if ($this->usage_limit && $this->used_count >= $this->usage_limit) {
                return ['valid' => false, 'message' => 'ظرفیت استفاده از این کد تکمیل شده است'];
            }

            // ۵. محدودیت هر کاربر
            $userUsageCount = DB::table('coupon_user')
                ->where('coupon_id', $this->id)
                ->where('user_id', $userId)
                ->count();
            
            if ($userUsageCount >= $this->usage_limit_per_user) {
                return ['valid' => false, 'message' => 'شما قبلاً از این کد استفاده کرده‌اید'];
            }

            // ۶. حداقل مبلغ سفارش
            if ($subtotal < $this->min_order_amount) {
                return [
                    'valid' => false,
                    'message' => 'حداقل مبلغ سفارش برای این کد ' . number_format($this->min_order_amount) . ' تومان است'
                ];
            }

            // ۷. بررسی محصولات قابل استفاده
            if ($this->applicable_to !== 'all' && !empty($this->applicable_ids)) {
                $isApplicable = $this->checkProductApplicability($productIds);
                if (!$isApplicable) {
                    return ['valid' => false, 'message' => 'این کد برای محصولات انتخابی شما قابل استفاده نیست'];
                }
            }

            return ['valid' => true, 'message' => 'کد معتبر است'];
        } catch (\Exception $e) {
            Log::error('Coupon@isValidFor: ' . $e->getMessage());
            return ['valid' => false, 'message' => 'خطا در بررسی اعتبار کد'];
        }
    }

    /**
     * بررسی قابلیت استفاده برای محصولات
     */
    private function checkProductApplicability(array $productIds): bool
    {
        if (empty($productIds)) return false;

        $applicableIds = $this->applicable_ids ?? [];

        switch ($this->applicable_to) {
            case 'products':
                return !empty(array_intersect($productIds, $applicableIds));

            case 'categories':
                $productCategories = Product::whereIn('id', $productIds)
                    ->pluck('category_id')
                    ->unique()
                    ->toArray();
                return !empty(array_intersect($productCategories, $applicableIds));

            case 'brands':
                $productBrands = Product::whereIn('id', $productIds)
                    ->pluck('brand_id')
                    ->unique()
                    ->toArray();
                return !empty(array_intersect($productBrands, $applicableIds));

            default:
                return true;
        }
    }

    /**
     * محاسبه مبلغ تخفیف
     */
    public function calculateDiscount(float $subtotal): float
    {
        try {
            if ($this->type === 'percentage') {
                $discount = $subtotal * ($this->value / 100);
                if ($this->max_discount && $discount > $this->max_discount) {
                    $discount = $this->max_discount;
                }
            } else {
                $discount = $this->value;
            }

            // تخفیف نمی‌تواند بیشتر از مبلغ سفارش باشد
            return min($discount, $subtotal);
        } catch (\Exception $e) {
            Log::error('Coupon@calculateDiscount: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * ثبت استفاده از کوپن
     */
    public function recordUsage(int $userId, ?int $orderId, float $discountAmount): void
    {
        try {
            DB::table('coupon_user')->insert([
                'coupon_id' => $this->id,
                'user_id' => $userId,
                'order_id' => $orderId,
                'discount_amount' => $discountAmount,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->increment('used_count');
        } catch (\Exception $e) {
            Log::error('Coupon@recordUsage: ' . $e->getMessage());
        }
    }
}