<?php

namespace Database\Factories;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    protected $model = Store::class;

    public function definition(): array
    {
        return [
            'seller_id' => User::factory(['role' => 'seller']),
            'name' => 'فروشگاه '.fake()->company(),
            'phone' => fake()->numerify('09#########'),
            'province' => 'تهران',
            'city' => 'تهران',
            'address' => fake()->address(),
            'latitude' => fake()->latitude(35.5, 35.9),
            'longitude' => fake()->longitude(51.1, 51.5),
            'is_active' => true,
            'verified_at' => null,
        ];
    }

    /**
     * فروشگاهی که واقعاً می‌تواند در جستجوی عمومی «نزدیک من» دیده شود —
     * رجوع به Store::scopePubliclyDiscoverable.
     */
    public function verified(): static
    {
        return $this->state(fn () => ['verified_at' => now()]);
    }
}
