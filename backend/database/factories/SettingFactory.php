<?php

namespace Database\Factories;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SettingFactory extends Factory
{
    protected $model = Setting::class;

    public function definition(): array
    {
        return [
            'key' => fake()->unique()->regexify('[a-z_]{5,15}') . '_' . fake()->unique()->numberBetween(1000, 99999),
            'value' => fake()->sentence(),
            'group' => fake()->randomElement(['general', 'email', 'sms', 'payment', 'security']),
            'type' => fake()->randomElement(['text', 'number', 'boolean', 'json']),
            'label' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'is_locked' => false,
            'is_sensitive' => false,
            'updated_by' => null,
        ];
    }

    public function locked(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_locked' => true,
        ]);
    }

    public function sensitive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_sensitive' => true,
        ]);
    }

    public function general(): static
    {
        return $this->state(fn (array $attributes) => [
            'group' => 'general',
        ]);
    }

    public function email(): static
    {
        return $this->state(fn (array $attributes) => [
            'group' => 'email',
        ]);
    }

    public function updatedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'updated_by' => $user->id,
        ]);
    }
}