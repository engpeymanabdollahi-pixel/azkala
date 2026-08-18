<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\User;
use App\Models\DeviceModel;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🛍️ در حال ساخت محصولات نمونه...');
        
        $categories = Category::all();
        $brands = Brand::all();
        $sellers = User::where('role', 'seller')->get();
        $deviceModels = DeviceModel::all();

        if ($categories->isEmpty() || $brands->isEmpty()) {
            $this->command->warn('لطفاً ابتدا CategorySeeder و BrandSeeder را اجرا کنید!');
            return;
        }

        $products = [
            ['name' => 'Silicone Case Samsung Galaxy S24', 'price' => 250000, 'discount_price' => 199000, 'stock' => 50, 'is_featured' => true, 'is_special_offer' => true],
            ['name' => 'Full Glue Glass iPhone 15 Pro', 'price' => 180000, 'discount_price' => 149000, 'stock' => 100, 'is_featured' => true],
            ['name' => 'Anker 65W Fast Charger', 'price' => 850000, 'discount_price' => 749000, 'stock' => 30, 'is_featured' => true, 'is_special_offer' => true],
            ['name' => 'AirPods Pro 2', 'price' => 9500000, 'discount_price' => 8900000, 'stock' => 20, 'is_featured' => true],
            ['name' => 'Xiaomi 20000mAh Power Bank', 'price' => 1200000, 'discount_price' => 999000, 'stock' => 40, 'is_special_offer' => true],
            ['name' => 'Baseus Type-C Cable 100W', 'price' => 320000, 'stock' => 75],
            ['name' => 'Samsung Galaxy Watch 6', 'price' => 12500000, 'discount_price' => 11900000, 'stock' => 15, 'is_featured' => true],
            ['name' => 'Magnetic Car Holder', 'price' => 180000, 'stock' => 60],
            ['name' => 'Leather Case Huawei P60 Pro', 'price' => 450000, 'discount_price' => 380000, 'stock' => 25],
            ['name' => 'Sony WH-1000XM5 Headphones', 'price' => 18500000, 'stock' => 10, 'is_featured' => true],
        ];

        foreach ($products as $index => $productData) {
            $slug = Str::slug($productData['name'], '-');
            
            // ✅ بررسی عدم تکرار قبل از ساخت
            if (Product::where('slug', $slug)->exists()) {
                continue;
            }

            $product = Product::create([
                'category_id' => $categories->random()->id,
                'brand_id' => $brands->random()->id,
                'seller_id' => $sellers->isNotEmpty() ? $sellers->random()->id : null,
                'name' => $productData['name'],
                'slug' => $slug,
                'short_description' => $productData['short_description'] ?? 'محصول با کیفیت عالی',
                'description' => $productData['description'] ?? 'توضیحات کامل محصول در اینجا قرار می‌گیرد.',
                'price' => $productData['price'],
                'discount_price' => $productData['discount_price'] ?? null,
                'stock' => $productData['stock'],
                'sku' => 'AZK-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'is_active' => true,
                'is_featured' => $productData['is_featured'] ?? false,
                'is_special_offer' => $productData['is_special_offer'] ?? false,
                'special_offer_ends_at' => isset($productData['is_special_offer']) ? now()->addDays(30) : null,
            ]);

            // ✅ Device-First Architecture فاز ۱J: سازگاری دستگاه اکنون از
            // طریق device_model_product نوشته می‌شود، نه ستونِ حذف‌شده‌ی
            // products.device_model_id.
            if ($deviceModels->isNotEmpty()) {
                $product->deviceModels()->sync([$deviceModels->random()->id]);
            }
        }

        $this->command->info('✅ محصولات نمونه با موفقیت ساخته شدند!');
    }
}