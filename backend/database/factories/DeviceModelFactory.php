<?php

namespace Database\Factories;

use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceModelFactory extends Factory
{
    protected $model = DeviceModel::class;

    public function definition(): array
    {
        return [
            'series_id' => DeviceSeries::factory(),
            'name' => fake()->unique()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'release_year' => fake()->year(),
        ];
    }
}