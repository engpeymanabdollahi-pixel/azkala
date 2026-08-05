<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\User;
use App\Models\DeviceModel;
use Illuminate\Support\Str;

class MasterProductSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🛍️ شروع ایجاد دیتابیس جامع محصولات ازکالا...');
        
        $categories = Category::all();
        $brands = Brand::all()->keyBy('slug');
        $sellers = User::where('role', 'seller')->get();
        $deviceModels = DeviceModel::all()->keyBy('slug');
        
        if ($categories->isEmpty()) {
            $this->command->error('❌ لطفاً ابتدا CategorySeeder را اجرا کنید!');
            return;
        }
        
        if ($brands->isEmpty()) {
            $this->command->error('❌ لطفاً ابتدا BrandSeeder را اجرا کنید!');
            return;
        }

        $products = $this->getMasterProducts();
        $created = 0;
        $updated = 0;

        foreach ($products as $productData) {
            $slug = Str::slug($productData['name'], '-');
            
            $existing = Product::where('slug', $slug)->first();
            
            $category = $this->getCategoryBySlug($productData['category_slug']);
            $brand = $brands->get($productData['brand_slug']);
            $deviceModel = isset($productData['device_slug']) ? $deviceModels->get($productData['device_slug']) : null;
            
            $data = [
                'category_id' => $category?->id ?? $categories->random()->id,
                'brand_id' => $brand?->id,
                'seller_id' => $sellers->isNotEmpty() ? $sellers->random()->id : null,
                'device_model_id' => $deviceModel?->id,
                'name' => $productData['name'],
                'slug' => $slug,
                'short_description' => $productData['short_description'] ?? null,
                'description' => $productData['description'] ?? null,
                'price' => $productData['price'],
                'discount_price' => $productData['discount_price'] ?? null,
                'stock' => $productData['stock'] ?? rand(10, 100),
                'sku' => $productData['sku'] ?? 'AZK-' . strtoupper(Str::random(8)),
                'main_image' => $productData['main_image'] ?? null,
                'gallery' => $productData['gallery'] ?? null,
                'specifications' => $productData['specifications'] ?? null,
                'rating' => $productData['rating'] ?? rand(40, 50) / 10,
                'reviews_count' => $productData['reviews_count'] ?? rand(0, 50),
                'views_count' => $productData['views_count'] ?? rand(100, 5000),
                'sales_count' => $productData['sales_count'] ?? rand(0, 200),
                'is_active' => true,
                'is_featured' => $productData['is_featured'] ?? false,
                'is_special_offer' => $productData['is_special_offer'] ?? false,
                'special_offer_ends_at' => ($productData['is_special_offer'] ?? false) ? now()->addDays(30) : null,
            ];

            if ($existing) {
                $existing->update($data);
                $updated++;
            } else {
                Product::create($data);
                $created++;
            }
        }

        $this->command->info("✅ {$created} محصول جدید ایجاد و {$updated} محصول به‌روزرسانی شد!");
        $this->command->info('📊 مجموع کل محصولات: ' . Product::count());
    }

    private function getCategoryBySlug($slug)
    {
        return Category::where('slug', $slug)->first();
    }

    private function getMasterProducts(): array
    {
        return [
            // ===== قاب و کاور =====
            $this->createProduct(
                'Silicone Case Samsung Galaxy S24 Ultra - Black',
                'case-cover',
                'spigen',
                'galaxy-s24-ultra',
                450000,
                380000,
                'قاب سیلیکونی اصلی Spigen برای گلکسی S24 اولترا - محافظت عالی با طراحی مینیمال',
                'این قاب سیلیکونی با کیفیت بالا از سری Liquid Air اسپایگن، محافظتی ایده‌آل برای گوشی شما فراهم می‌کند.',
                ['material' => 'سیلیکون مایع', 'compatibility' => 'Galaxy S24 Ultra', 'color' => 'مشکی'],
                'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=600&h=600&fit=crop'
            ),
            
            $this->createProduct(
                'Leather Case iPhone 15 Pro Max - Brown',
                'case-cover',
                'apple',
                'iphone-15-pro-max',
                1200000,
                990000,
                'قاب چرمی اصلی اپل برای آیفون ۱۵ پرو مکس - رنگ قهوه‌ای کلاسیک',
                'قاب چرمی اصلی اپل با گذشت زمان پاتینه زیبایی پیدا می‌کند.',
                ['material' => 'چرم طبیعی', 'compatibility' => 'iPhone 15 Pro Max', 'color' => 'قهوه‌ای'],
                'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=600&h=600&fit=crop'
            ),

            // ===== گلس و محافظ صفحه =====
            $this->createProduct(
                'Full Glue Glass iPhone 15 Pro - Privacy',
                'screen-protector',
                'baseus',
                'iphone-15-pro',
                350000,
                280000,
                'گلس تمام چسب حریم خصوصی بیسوس برای آیفون ۱۵ پرو',
                'گلس حریم خصوصی Baseus با تکنولوژی Micro-louver، اطلاعات شما را از دید اطرافیان محافظت می‌کند.',
                ['type' => 'گلس حریم خصوصی', 'compatibility' => 'iPhone 15 Pro', 'hardness' => '9H'],
                'https://images.unsplash.com/photo-1592899677712-a5a25450336b?w=600&h=600&fit=crop'
            ),

            // ===== شارژر و کابل =====
            $this->createProduct(
                'Anker 65W GaN Fast Charger - USB-C',
                'charger-cable',
                'anker',
                null,
                1250000,
                1050000,
                'شارژر دیواری ۶۵ وات انکر با تکنولوژی GaN - فست شارژ جهانی',
                'شارژر Anker PowerPort III با تکنولوژی گالیوم نیترید، اندازه‌ای ۵۰٪ کوچکتر از شارژرهای معمولی.',
                ['power' => '65W', 'ports' => '2x USB-C, 1x USB-A', 'technology' => 'GaN II'],
                'https://images.unsplash.com/photo-1616169047486-442eaf4d1430?w=600&h=600&fit=crop',
                true
            ),
            
            $this->createProduct(
                'Baseus 100W Type-C Cable 2m - Braided',
                'charger-cable',
                'baseus',
                null,
                450000,
                380000,
                'کابل تایپ سی به تایپ سی بیسوس ۱۰۰ وات - ۲ متر بافته شده',
                'کابل Baseus Cafule با پشتیبانی از ۱۰۰ وات شارژ سریع و انتقال داده تا ۴۸۰Mbps.',
                ['length' => '2m', 'power' => '100W', 'data_transfer' => '480Mbps'],
                'https://images.unsplash.com/photo-1616169047486-442eaf4d1430?w=600&h=600&fit=crop'
            ),

            // ===== هندزفری و هدفون =====
            $this->createProduct(
                'Apple AirPods Pro 2nd Gen - USB-C',
                'headphone',
                'apple',
                null,
                9500000,
                8900000,
                'ایرپاد پرو نسل ۲ با کیس USB-C - حذف نویز پیشرفته',
                'AirPods Pro نسل دوم با تراشه H2 اپل، حذف نویز فعال را تا ۲ برابر بهبود بخشیده است.',
                ['type' => 'TWS', 'anc' => 'Active Noise Cancellation', 'battery' => '30 ساعت با کیس'],
                'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=600&h=600&fit=crop',
                true
            ),
            
            $this->createProduct(
                'Sony WH-1000XM5 Wireless Headphones - Black',
                'headphone',
                'sony',
                null,
                18500000,
                17200000,
                'هدفون بی‌سیم سونی WH-1000XM5 - بهترین حذف نویز جهان',
                'هدفون Sony WH-1000XM5 با دو پردازنده V1 و QN1، بهترین حذف نویز صنعت را ارائه می‌دهد.',
                ['type' => 'Over-Ear', 'anc' => 'Industry Leading ANC', 'battery' => '30 ساعت'],
                'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop',
                true
            ),
            
            $this->createProduct(
                'JBL Tune 770NC Wireless - Blue',
                'headphone',
                'jbl',
                null,
                4200000,
                3600000,
                'هدفون بی‌سیم JBL Tune 770NC - حذف نویز تطبیقی',
                'هدفون JBL Tune 770NC با صدای signature JBL Pure Bass و حذف نویز تطبیقی.',
                ['type' => 'Over-Ear', 'anc' => 'Adaptive ANC', 'battery' => '70 ساعت'],
                'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop'
            ),

            // ===== پاوربانک =====
            $this->createProduct(
                'Anker PowerCore 20000mAh 22.5W - Black',
                'powerbank',
                'anker',
                null,
                1850000,
                1550000,
                'پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر ۲۲.۵ وات - فست شارژ',
                'پاوربانک Anker PowerCore Essential با ظرفیت ۲۰۰۰۰ میلی‌آمپر، گوشی شما را تا ۵ بار شارژ می‌کند.',
                ['capacity' => '20000mAh', 'output' => '22.5W', 'ports' => '2x USB-A, 1x USB-C'],
                'https://images.unsplash.com/photo-1609592425066-8e3f0a0c5d5f?w=600&h=600&fit=crop'
            ),
            
            $this->createProduct(
                'Xiaomi Power Bank 3 Pro 20000mAh 50W',
                'powerbank',
                'xiaomi',
                null,
                1650000,
                1380000,
                'پاوربانک شیائومی ۲۰۰۰۰ میلی‌آمپر ۵۰ وات - دو طرفه فست شارژ',
                'پاوربانک Xiaomi 3 Pro با پشتیبانی از شارژ ۵۰ وات ورودی و خروجی.',
                ['capacity' => '20000mAh', 'output' => '50W', 'ports' => '2x USB-A, 2x USB-C'],
                'https://images.unsplash.com/photo-1609592425066-8e3f0a0c5d5f?w=600&h=600&fit=crop'
            ),

            // ===== ساعت هوشمند =====
            $this->createProduct(
                'Apple Watch Series 9 GPS 45mm - Midnight',
                'smartwatch',
                'apple',
                null,
                18500000,
                17200000,
                'اپل واچ سری ۹ جی‌پی‌اس ۴۵ میلی‌متری - رنگ میدنایت',
                'اپل واچ Series 9 با تراشه S9 SiP، قابلیت Double Tap جدید.',
                ['display' => '45mm LTPO OLED', 'battery' => '18 ساعت', 'connectivity' => 'GPS'],
                'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop',
                true
            ),
            
            $this->createProduct(
                'Samsung Galaxy Watch 6 Classic 47mm - Black',
                'smartwatch',
                'samsung',
                null,
                16800000,
                15500000,
                'گلکسی واچ ۶ کلاسیک ۴۷ میلی‌متری - طراحی چرخشی',
                'گلکسی واچ 6 Classic با حلقه چرخشی بی‌زل، تجربه‌ای نوستالژیک.',
                ['display' => '47mm Super AMOLED', 'battery' => '40 ساعت', 'connectivity' => 'Bluetooth'],
                'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop',
                true
            ),

            // ===== هولدر و پایه =====
            $this->createProduct(
                'Baseus Magnetic Car Holder - Air Vent',
                'holder-stand',
                'baseus',
                null,
                280000,
                220000,
                'هولدر ماشین مغناطیسی بیسوس - نصب روی دریچه',
                'هولدر Baseus با ۶ آهنربای N52، گوشی را محکم نگه می‌دارد.',
                ['type' => 'دریچه کولر', 'mounting' => 'مغناطیسی'],
                'https://images.unsplash.com/photo-1586953229671-e47ce304b0d4?w=600&h=600&fit=crop'
            ),
        ];
    }

    private function createProduct(
        string $name,
        string $categorySlug,
        string $brandSlug,
        ?string $deviceSlug,
        int $price,
        ?int $discountPrice,
        string $shortDescription,
        string $description,
        array $specifications,
        ?string $mainImage = null,
        bool $isFeatured = false
    ): array {
        $images = $mainImage ? [
            $mainImage,
            str_replace('w=600', 'w=400', $mainImage),
            str_replace('w=600', 'w=300', $mainImage),
        ] : null;

        return [
            'name' => $name,
            'category_slug' => $categorySlug,
            'brand_slug' => $brandSlug,
            'device_slug' => $deviceSlug,
            'price' => $price,
            'discount_price' => $discountPrice,
            'short_description' => $shortDescription,
            'description' => $description,
            'specifications' => $specifications,
            'main_image' => $mainImage,
            'gallery' => $images,
            'is_featured' => $isFeatured,
            'is_special_offer' => $discountPrice !== null && $discountPrice < $price,
        ];
    }
}
