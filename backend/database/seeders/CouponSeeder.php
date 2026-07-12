<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'SALE10',
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 100000,
                'max_discount' => 100000,
                'usage_limit' => 1000,
                'usage_limit_per_user' => 3,
                'start_date' => now(),
                'end_date' => now()->addMonths(3),
                'description' => '۱۰٪ تخفیف برای سفارش‌های بالای ۱۰۰ هزار تومان',
                'applicable_to' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'WELCOME',
                'type' => 'fixed',
                'value' => 50000,
                'min_order_amount' => 200000,
                'usage_limit' => 500,
                'usage_limit_per_user' => 1,
                'start_date' => now(),
                'end_date' => now()->addMonth(),
                'description' => '۵۰ هزار تومان تخفیف برای اولین خرید',
                'applicable_to' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'SUMMER25',
                'type' => 'percentage',
                'value' => 25,
                'min_order_amount' => 500000,
                'max_discount' => 250000,
                'usage_limit' => 200,
                'usage_limit_per_user' => 2,
                'start_date' => now(),
                'end_date' => now()->addMonths(2),
                'description' => '۲۵٪ تخفیف ویژه تابستانه',
                'applicable_to' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'FREE50',
                'type' => 'fixed',
                'value' => 50000,
                'min_order_amount' => 0,
                'usage_limit' => 100,
                'usage_limit_per_user' => 1,
                'start_date' => now(),
                'end_date' => now()->addDays(30),
                'description' => '۵۰ هزار تومان تخفیف بدون حداقل خرید',
                'applicable_to' => 'all',
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $couponData) {
            Coupon::firstOrCreate(
                ['code' => $couponData['code']],
                $couponData
            );
            echo "✅ کوپن '{$couponData['code']}' ایجاد شد\n";
        }
    }
}