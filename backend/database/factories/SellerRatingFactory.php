<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class SellerRatingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'seller_id' => User::factory(),
            'order_id' => Order::factory(),
            'product_quality' => fake()->numberBetween(1, 5),
            'shipping_speed' => fake()->numberBetween(1, 5),
            'communication' => fake()->numberBetween(1, 5),
            'overall_rating' => fake()->randomFloat(1, 1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }

    public function fiveStars(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_quality' => 5,
            'shipping_speed' => 5,
            'communication' => 5,
            'overall_rating' => 5.0,
            'comment' => 'Excellent service!',
        ]);
    }

    public function oneStar(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_quality' => 1,
            'shipping_speed' => 1,
            'communication' => 1,
            'overall_rating' => 1.0,
            'comment' => 'Terrible service!',
        ]);
    }
}