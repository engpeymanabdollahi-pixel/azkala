<?php

namespace Database\Factories;

use App\Models\DeviceBrand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DeviceBrandFactory extends Factory
{
    protected $model = DeviceBrand::class;

    public function definition(): array
    {
        $name = $this->faker->company();
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'type' => $this->faker->randomElement(['mobile', 'laptop', 'tablet', 'accessory']),
            'is_active' => true,
        ];
    }
}