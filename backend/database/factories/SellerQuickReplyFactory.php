<?php

namespace Database\Factories;

use App\Models\SellerQuickReply;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SellerQuickReplyFactory extends Factory
{
    protected $model = SellerQuickReply::class;

    public function definition(): array
    {
        return [
            'seller_id' => User::factory(['role' => 'seller']),
            'title' => fake()->sentence(3),
            'content' => fake()->paragraph(),
        ];
    }
}