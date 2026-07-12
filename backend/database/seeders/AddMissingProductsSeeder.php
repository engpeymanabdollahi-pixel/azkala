<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AddMissingProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name' => 'شارژر 45W سامسونگ S24 Ultra',
                'slug' => 'charger-45w-samsung-s24-ultra',
                'short_description' => 'شارژر اصلی سامسونگ • توان 45 وات • پورت USB-C • سازگار با S24 Ultra',
                'description' => 'شارژر اصلی سامسونگ با توان 45 وات، مناسب برای شارژ سریع گوشی‌های سامسونگ Galaxy S24 Ultra و سایر دستگاه‌های سازگار با پورت USB-C. این شارژر با فناوری Super Fast Charging 2.0 سازگار است و می‌تواند گوشی شما را در کمترین زمان ممکن شارژ کند.',
                'price' => 850000,
                'discount_price' => 750000,
                'stock' => 30,
                'sku' => 'AZK-CHG-45W-S24',
                'is_featured' => true,
                'is_special_offer' => true,
            ],
            [
                'name' => 'قاب سیلیکونی سامسونگ S24 Ultra',
                'slug' => 'silicone-case-samsung-s24-ultra',
                'short_description' => 'قاب سیلیکونی اصلی • محافظت کامل • ضد لغزش',
                'description' => 'قاب سیلیکونی اصلی سامسونگ برای Galaxy S24 Ultra، با طراحی دقیق و محافظت کامل از گوشی شما در برابر ضربه و خط و خش.',
                'price' => 450000,
                'discount_price' => 380000,
                'stock' => 50,
                'sku' => 'AZK-CASE-SIL-S24',
                'is_featured' => false,
                'is_special_offer' => true,
            ],
            [
                'name' => 'شارژر بی‌سیم سامسونگ 15W',
                'slug' => 'samsung-wireless-charger-15w',
                'short_description' => 'شارژر بی‌سیم • توان 15 وات • سازگار با Qi',
                'description' => 'شارژر بی‌سیم سامسونگ با توان 15 وات، سازگار با استاندارد Qi و تمامی گوشی‌های دارای قابلیت شارژ بی‌سیم.',
                'price' => 950000,
                'discount_price' => null,
                'stock' => 25,
                'sku' => 'AZK-WRLS-15W',
                'is_featured' => true,
                'is_special_offer' => false,
            ],
            [
                'name' => 'کابل USB-C به USB-C سامسونگ',
                'slug' => 'samsung-usb-c-cable',
                'short_description' => 'کابل اصلی • طول 1.5 متر • پشتیبانی از 45W',
                'description' => 'کابل USB-C به USB-C اصلی سامسونگ با طول 1.5 متر، پشتیبانی از شارژ سریع تا 45 وات و انتقال داده با سرعت بالا.',
                'price' => 280000,
                'discount_price' => 220000,
                'stock' => 100,
                'sku' => 'AZK-CBL-USBC-1.5',
                'is_featured' => false,
                'is_special_offer' => true,
            ],
        ];

        // دریافت اولین category و brand سامسونگ
        $category = Category::first();
        $samsungBrand = Brand::where('name', 'like', '%Samsung%')->first() ?? Brand::first();

        foreach ($products as $productData) {
            // بررسی عدم تکرار
            if (Product::where('slug', $productData['slug'])->exists()) {
                echo "⚠️  محصول '{$productData['name']}' قبلاً وجود دارد، رد شد\n";
                continue;
            }

            Product::create([
                'category_id' => $category?->id ?? 1,
                'brand_id' => $samsungBrand?->id ?? 1,
                'seller_id' => null,
                'name' => $productData['name'],
                'slug' => $productData['slug'],
                'short_description' => $productData['short_description'],
                'description' => $productData['description'],
                'price' => $productData['price'],
                'discount_price' => $productData['discount_price'],
                'stock' => $productData['stock'],
                'sku' => $productData['sku'],
                'main_image' => null,
                'gallery' => [],
                'rating' => 4.5,
                'reviews_count' => rand(10, 100),
                'views_count' => rand(100, 1000),
                'sales_count' => rand(5, 50),
                'is_active' => true,
                'is_featured' => $productData['is_featured'],
                'is_special_offer' => $productData['is_special_offer'],
                'special_offer_ends_at' => $productData['is_special_offer'] 
                    ? now()->addDays(7) 
                    : null,
            ]);

            echo "✅ محصول '{$productData['name']}' ایجاد شد\n";
        }

        echo "\n🎉 تمام محصولات جدید با موفقیت ایجاد شدند!\n";
    }
}