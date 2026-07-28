<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Cart;
use Illuminate\Support\Facades\Log;

class CouponService
{
    public function validateCoupon(string $code, int $userId): array
    {
        $code = strtoupper(trim($code));
        
        if (empty($code)) {
            return ['success' => false, 'message' => 'کد تخفیف الزامی است', 'status' => 422];
        }

        $coupon = Coupon::where('code', $code)->first();
        if (!$coupon) {
            return ['success' => false, 'message' => 'کد تخفیف نامعتبر است', 'status' => 404];
        }

        // محاسبه مبلغ سبد خرید
        $cart = Cart::with('items')->where('user_id', $userId)->first();
        $subtotal = 0;
        $productIds = [];

        if ($cart && $cart->items) {
            foreach ($cart->items as $item) {
                $subtotal += $item->price * $item->quantity;
                $productIds[] = $item->product_id;
            }
        }

        $validation = $coupon->isValidFor($userId, $subtotal, $productIds);

        if (!$validation['valid']) {
            return ['success' => false, 'message' => $validation['message'], 'status' => 400];
        }

        $discountAmount = $coupon->calculateDiscount($subtotal);

        return [
            'success' => true,
            'status' => 200,
            'data' => [
                'coupon' => [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'type' => $coupon->type,
                    'value' => (float) $coupon->value,
                    'description' => $coupon->description,
                    'max_discount' => $coupon->max_discount ? (float) $coupon->max_discount : null,
                ],
                'discount_amount' => (float) $discountAmount,
                'message' => 'کد تخفیف با موفقیت اعمال شد',
            ]
        ];
    }

    public function getMyCoupons(): array
    {
        $coupons = Coupon::where('is_active', true)
            ->where('applicable_to', 'all')
            ->select('id', 'code', 'type', 'value', 'min_order_amount', 'max_discount', 'end_date', 'description')
            ->get();

        return ['success' => true, 'data' => $coupons];
    }

    public function getAllCoupons(int $perPage = 20)
    {
        return Coupon::orderByDesc('created_at')->paginate($perPage);
    }

    public function createCoupon(array $data, int $createdBy): Coupon
    {
        $data['code'] = strtoupper(trim($data['code']));
        $data['created_by'] = $createdBy;
        $data['applicable_to'] = $data['applicable_to'] ?? 'all';
        
        return Coupon::create($data);
    }

    public function updateCoupon(Coupon $coupon, array $data): Coupon
    {
        $coupon->update($data);
        return $coupon;
    }

    public function deleteCoupon(Coupon $coupon): bool
    {
        return $coupon->delete();
    }
}