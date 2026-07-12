<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'brand_id' => null,
            'seller_id' => User::factory(['role' => 'seller']),
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1000, 99999),
            'short_description' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'price' => fake()->numberBetween(50000, 500000),
            'discount_price' => null,
            'stock' => fake()->numberBetween(0, 100),
            'sku' => 'SKU-' . strtoupper(fake()->unique()->regexify('[A-Z0-9]{8}')),
            'main_image' => null,
            'gallery' => null,
            'rating' => fake()->randomFloat(1, 0, 5),
            'reviews_count' => fake()->numberBetween(0, 50),
            'views_count' => fake()->numberBetween(0, 1000),
            'sales_count' => fake()->numberBetween(0, 100),
            'is_active' => true,
            'is_featured' => false,
            'is_special_offer' => false,
            'special_offer_ends_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }

    public function withBrand(Brand $brand): static
    {
        return $this->state(fn (array $attributes) => [
            'brand_id' => $brand->id,
        ]);
    }

    public function specialOffer(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_special_offer' => true,
            'discount_price' => $attributes['price'] * 0.8,
            'special_offer_ends_at' => now()->addDays(7),
        ]);
    }
}