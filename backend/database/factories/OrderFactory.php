<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->numberBetween(50000, 500000);
        $tax = (int)($subtotal * 0.09);
        $shipping = fake()->numberBetween(0, 30000);
        $discount = fake()->numberBetween(0, 50000);
        $total = $subtotal + $tax + $shipping - $discount;

        return [
            'user_id' => User::factory(),
            'order_number' => 'ORD-' . strtoupper(fake()->unique()->regexify('[A-Z0-9]{8}')),
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'cancelled']),
            'payment_status' => fake()->randomElement(['pending', 'paid', 'failed', 'refunded']),
            'payment_method' => fake()->randomElement(['online', 'cod', 'wallet']),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping' => $shipping,
            'discount' => $discount,
            'total' => $total,
            'shipping_address' => fake()->address(),
            'tracking_number' => fake()->optional()->numerify('TRK##########'),
            'notes' => fake()->optional()->sentence(),
            'coupon_code' => null,
            'coupon_id' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}