<?php

namespace Database\Factories;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceSeriesFactory extends Factory
{
    protected $model = DeviceSeries::class;

    public function definition(): array
    {
        return [
            'brand_id' => DeviceBrand::factory(),
            'name' => fake()->unique()->words(2, true),
            'slug' => fake()->unique()->slug(),
        ];
    }
}