<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper($this->faker->unique()->lexify('????????')),
            'type' => $this->faker->randomElement(['percentage', 'fixed']),
            'value' => $this->faker->numberBetween(5, 50),
            'min_order_amount' => $this->faker->randomElement([0, 50000, 100000]),
            'max_discount' => $this->faker->randomElement([null, 100000, 200000]),
            'usage_limit' => $this->faker->randomElement([null, 100, 500]),
            'usage_limit_per_user' => 10, // ✅ مقدار پیش‌فرض بالا برای جلوگیری از تداخل در تست‌ها
            'used_count' => 0,
            'start_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'end_date' => $this->faker->dateTimeBetween('now', '+1 year'),
            'is_active' => true,
            'description' => $this->faker->sentence,
            'applicable_to' => 'all',
            'applicable_ids' => null,
        ];
    }
}