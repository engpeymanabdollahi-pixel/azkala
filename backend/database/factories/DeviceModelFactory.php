<?php
namespace Database\Factories;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceModelFactory extends Factory {
    protected $model = DeviceModel::class;
    public function definition() {
        return [
            'series_id' => DeviceSeries::factory(), 
            'name' => $this->faker->word, 
            'slug' => $this->faker->unique()->slug, 
            'release_year' => $this->faker->year
        ];
    }
}