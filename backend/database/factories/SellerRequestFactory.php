<?php

namespace Database\Factories;

use App\Models\SellerRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SellerRequestFactory extends Factory
{
    protected $model = SellerRequest::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'shop_name' => fake()->company(),
            'national_code' => fake()->numerify('##########'),
            'phone' => fake()->phoneNumber(),
            'description' => fake()->sentence(),
            'id_card_image' => null,
            'business_license' => null,
            'status' => 'pending',
            'rejection_reason' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejection_reason' => fake()->sentence(),
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }
}