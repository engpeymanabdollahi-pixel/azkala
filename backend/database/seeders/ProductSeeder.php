<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::all();
        $brands = Brand::all();

        if ($categories->isEmpty() || $brands->isEmpty()) {
            $this->command->warn('Please run CategorySeeder and BrandSeeder first!');
            return;
        }

        $products = [
            [
                'name' => 'Silicone Case Samsung Galaxy S24',
                'short_description' => 'High quality silicone case',
                'description' => 'High quality silicone case for Samsung Galaxy S24 with complete protection.',
                'price' => 250000,
                'discount_price' => 199000,
                'stock' => 50,
                'is_featured' => true,
                'is_special_offer' => true,
            ],
            [
                'name' => 'Full Glue Glass iPhone 15 Pro',
                'short_description' => '9D screen protector',
                'description' => 'Full glue glass with 9D quality for iPhone 15 Pro with high transparency.',
                'price' => 180000,
                'discount_price' => 149000,
                'stock' => 100,
                'is_featured' => true,
            ],
            [
                'name' => 'Anker 65W Fast Charger',
                'short_description' => '65W fast charger',
                'description' => 'Anker 65W fast charger with PowerIQ 3.0 technology.',
                'price' => 850000,
                'discount_price' => 749000,
                'stock' => 30,
                'is_featured' => true,
                'is_special_offer' => true,
            ],
            [
                'name' => 'AirPods Pro 2',
                'short_description' => 'Second generation AirPods Pro',
                'description' => 'Apple wireless earbuds with excellent sound quality and active noise cancellation.',
                'price' => 9500000,
                'discount_price' => 8900000,
                'stock' => 20,
                'is_featured' => true,
            ],
            [
                'name' => 'Xiaomi 20000mAh Power Bank',
                'short_description' => 'High capacity power bank',
                'description' => 'Xiaomi 20000mAh power bank with fast charge support.',
                'price' => 1200000,
                'discount_price' => 999000,
                'stock' => 40,
                'is_special_offer' => true,
            ],
            [
                'name' => 'Baseus Type-C Cable 100W',
                'short_description' => '100W fast charge cable',
                'description' => 'Baseus Type-C cable with 100W fast charge support.',
                'price' => 320000,
                'stock' => 75,
            ],
            [
                'name' => 'Samsung Galaxy Watch 6',
                'short_description' => 'Samsung smart watch',
                'description' => 'Samsung smart watch with advanced health features.',
                'price' => 12500000,
                'discount_price' => 11900000,
                'stock' => 15,
                'is_featured' => true,
            ],
            [
                'name' => 'Magnetic Car Holder',
                'short_description' => 'Strong magnetic holder',
                'description' => 'Car holder with strong magnet for phone holding.',
                'price' => 180000,
                'stock' => 60,
            ],
            [
                'name' => 'Leather Case Huawei P60 Pro',
                'short_description' => 'Luxury leather case',
                'description' => 'High quality leather case for Huawei P60 Pro.',
                'price' => 450000,
                'discount_price' => 380000,
                'stock' => 25,
            ],
            [
                'name' => 'Sony WH-1000XM5 Headphones',
                'short_description' => 'Noise cancelling headphones',
                'description' => 'Sony wireless headphones with best noise cancellation in the market.',
                'price' => 18500000,
                'stock' => 10,
                'is_featured' => true,
            ],
        ];

        foreach ($products as $index => $productData) {
            Product::create([
                'category_id' => $categories->random()->id,
                'brand_id' => $brands->random()->id,
                'name' => $productData['name'],
                'slug' => Str::slug($productData['name'], '-') . '-' . ($index + 1),
                'short_description' => $productData['short_description'],
                'description' => $productData['description'],
                'price' => $productData['price'],
                'discount_price' => $productData['discount_price'] ?? null,
                'stock' => $productData['stock'],
                'sku' => 'AZK-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'is_active' => true,
                'is_featured' => $productData['is_featured'] ?? false,
                'is_special_offer' => $productData['is_special_offer'] ?? false,
                'special_offer_ends_at' => isset($productData['is_special_offer']) ? now()->addDays(7) : null,
            ]);
        }
    }
}