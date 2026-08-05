<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);
        
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'brand_id' => Brand::factory(),
            'category_id' => Category::factory(),
            'price' => fake()->numberBetween(50000, 5000000),
            'discount_price' => null,
            'stock_quantity' => fake()->numberBetween(0, 100),
            'sku' => strtoupper(fake()->unique()->bothify('AZ-###-???')),
            'technical_specs' => [
                'weight' => fake()->randomFloat(2, 0.1, 1.5) . ' kg',
                'dimensions' => fake()->numerify('###x###x## mm'),
                'material' => fake()->randomElement(['Silicone', 'Plastic', 'Metal', 'Leather']),
                'color' => fake()->safeColorName(),
            ],
            'seo_description' => fake()->paragraph(15),
            'is_active' => true,
            'is_featured' => fake()->boolean(20),
            'images' => [
                fake()->imageUrl(400, 400, 'product', true, 'Product'),
                fake()->imageUrl(400, 400, 'tech', true, 'Detail'),
            ],
        ];
    }

    /**
     * Indicate that the product is simple (no complex specs).
     */
    public function simple(): static
    {
        return $this->state(fn (array $attributes) => [
            'technical_specs' => ['type' => 'simple'],
        ]);
    }
}
