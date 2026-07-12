<?php

namespace Database\Factories;

use App\Models\Setting;
use App\Models\SettingHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SettingHistoryFactory extends Factory
{
    protected $model = SettingHistory::class;

    public function definition(): array
    {
        $setting = Setting::factory()->create();
        
        return [
            'setting_key' => $setting->key,
            'group' => $setting->group,
            'old_value' => fake()->sentence(),
            'new_value' => fake()->sentence(),
            'changed_by' => User::factory(['role' => 'admin']),
            'note' => fake()->optional()->sentence(),
            'label' => fake()->optional()->sentence(3),
        ];
    }

    public function forSetting(Setting $setting): static
    {
        return $this->state(fn (array $attributes) => [
            'setting_key' => $setting->key,
            'group' => $setting->group,
        ]);
    }
}