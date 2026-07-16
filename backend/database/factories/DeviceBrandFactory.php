<?php

namespace Database\Factories;

use App\Models\DeviceBrand;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceBrandFactory extends Factory
{
    protected $model = DeviceBrand::class;

    public function definition()
    {
        return [
            'name' => $this->faker->unique()->company,
            'slug' => $this->faker->unique()->slug
        ];
    }
}