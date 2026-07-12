<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'title' => fake()->optional()->sentence(),
            'comment' => fake()->paragraph(),
            'rating' => fake()->numberBetween(1, 5),
            'is_verified' => fake()->boolean(70),
            'helpful_count' => fake()->numberBetween(0, 50),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
            'images' => null,
            'admin_reply' => null,
            'replied_by' => null,
            'replied_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }

    public function fiveStars(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => 5,
        ]);
    }

    public function oneStar(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => 1,
        ]);
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
        ]);
    }

    public function withAdminReply(?User $admin = null): static
    {
        return $this->state(fn (array $attributes) => [
            'admin_reply' => fake()->paragraph(),
            'replied_by' => $admin?->id ?? User::factory(['role' => 'admin']),
            'replied_at' => now(),
        ]);
    }
}