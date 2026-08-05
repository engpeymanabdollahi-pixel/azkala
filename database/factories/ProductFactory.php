<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $brands = Brand::all();
        $categories = Category::all();
        
        $brand = $brands->random();
        $category = $categories->random();

        $productName = $this->generateProductName($brand->name);
        
        return [
            'name' => $productName,
            'slug' => \Str::slug($productName),
            'brand_id' => $brand->id,
            'price' => $this->faker->numberBetween(50000, 5000000),
            'compare_price' => null,
            'cost' => null,
            'stock' => $this->faker->numberBetween(10, 500),
            'sku' => strtoupper(substr($brand->slug, 0, 3)) . '-' . $this->faker->unique()->numberBetween(1000, 9999),
            'barcode' => null,
            'weight' => $this->faker->randomElement(['50g', '100g', '150g', '200g', '250g']),
            'dimensions' => null,
            'short_description' => $this->faker->sentence(15),
            'description' => $this->faker->paragraph(5),
            'meta_title' => $productName . ' | خرید با بهترین قیمت',
            'meta_description' => $this->faker->sentence(20),
            'meta_keywords' => $brand->name . ', ' . $category->name,
            'attributes' => json_encode($this->generateAttributes()),
            'images' => json_encode($this->generateImages()),
            'is_active' => true,
            'is_featured' => $this->faker->boolean(20),
            'published_at' => now(),
        ];
    }

    /**
     * تولید نام محصول تصادفی
     * 
     * @param string $brandName
     * @return string
     */
    private function generateProductName(string $brandName): string
    {
        $productTypes = [
            'Power Bank 10000mAh',
            'USB-C Cable 2m',
            'Wireless Charger 15W',
            'Phone Case Clear',
            'Screen Protector Glass',
            'Earbuds Pro',
            'Bluetooth Speaker',
            'Car Charger Dual USB',
            'Wall Charger 20W',
            'Smart Watch Band',
        ];

        return $brandName . ' ' . $this->faker->randomElement($productTypes);
    }

    /**
     * تولید مشخصات فنی تصادفی
     * 
     * @return array
     */
    private function generateAttributes(): array
    {
        return [
            'color' => $this->faker->randomElement(['Black', 'White', 'Blue', 'Red', 'Green']),
            'material' => $this->faker->randomElement(['Plastic', 'Metal', 'Silicone', 'TPU', 'Nylon']),
            'warranty' => $this->faker->randomElement(['6 months', '12 months', '18 months', '24 months']),
            'features' => $this->faker->randomElements([
                'Fast Charging',
                'Water Resistant',
                'Wireless Charging',
                'Drop Protection',
                'Anti-Scratch',
                'Lightweight',
                'Compact Design',
            ], $this->faker->numberBetween(1, 4)),
        ];
    }

    /**
     * تولید URLs تصاویر
     * 
     * @return array
     */
    private function generateImages(): array
    {
        return [
            'https://picsum.photos/seed/' . uniqid() . '/800/800',
            'https://picsum.photos/seed/' . uniqid() . '/800/800',
            'https://picsum.photos/seed/' . uniqid() . '/800/800',
        ];
    }

    /**
     * Indicate that the product is featured.
     *
     * @return static
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Indicate that the product is active.
     *
     * @return static
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the product is inactive.
     *
     * @return static
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the product has high stock.
     *
     * @return static
     */
    public function highStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => $this->faker->numberBetween(100, 1000),
        ]);
    }

    /**
     * Indicate that the product has low stock.
     *
     * @return static
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => $this->faker->numberBetween(1, 10),
        ]);
    }
}
