<?php
namespace Database\Factories;
use App\Models\DeviceSeries;
use App\Models\DeviceBrand;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceSeriesFactory extends Factory {
    protected $model = DeviceSeries::class;
    public function definition() {
        return [
            'brand_id' => DeviceBrand::factory(), 
            'name' => $this->faker->word, 
            'slug' => $this->faker->unique()->slug
        ];
    }
}