<?php

namespace Database\Factories;

use App\Models\DeviceBrand;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceBrandFactory extends Factory
{
    protected $model = DeviceBrand::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'slug' => fake()->unique()->slug(),
            'is_active' => true,
        ];
    }
}