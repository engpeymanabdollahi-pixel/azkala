<?php

namespace Database\Seeders\Data;

/**
 * Master Products Catalog - 200+ Best Sellers
 * Contains detailed product information for seeding
 */
class MasterProductsCatalog
{
    /**
     * Get sample products for initial seeding
     * 
     * @return array
     */
    public static function getSampleProducts(): array
    {
        return [
            [
                'base_name' => 'کیف محافظ لپ‌تاپ اپل مک‌بوک پرو 16 اینچ',
                'category_slug' => 'accessories/laptop-bags',
                'brand_slug' => 'apple',
                'technical_specs' => [
                    'material' => 'نئوپرن ضد آب',
                    'dimensions' => '40x28x3 cm',
                    'weight' => '350 گرم',
                    'color_options' => ['مشکی', 'خاکستری', 'آبی تیره'],
                    'compatibility' => 'MacBook Pro 16 inch 2019-2024',
                ],
                'seo_description' => 'کیف محافظ لپ‌تاپ اپل مک‌بوک پرو 16 اینچ، طراحی شده با بهترین مواد نئوپرن ضد آب. این کیف با ابعاد دقیق 40x28x3 سانتی‌متر، محافظت کاملی از لپ‌تاپ شما در برابر ضربه، خط و خش و رطوبت ارائه می‌دهد. مناسب برای MacBook Pro 16 اینچ مدل‌های 2019 تا 2024. دارای جیب اضافی برای شارژر و لوازم جانبی. سبک وزن تنها 350 گرم، ایده‌آل برای حمل روزانه.',
                'images' => [
                    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1496181133206-80ce9b88a8fe?w=400&h=400&fit=crop',
                ],
                'price' => 890000,
                'stock_quantity' => 45,
            ],
            [
                'base_name' => 'پاوربانک انکر PowerCore 20000mAh',
                'category_slug' => 'accessories/power-bank',
                'brand_slug' => 'anker',
                'technical_specs' => [
                    'capacity' => '20000mAh',
                    'input' => 'USB-C: 5V/3A, 9V/2A',
                    'output' => 'USB-A: 5V/3A, 9V/2A, 12V/1.5A',
                    'weight' => '356 گرم',
                    'dimensions' => '158x74x19 mm',
                    'features' => ['PowerIQ 2.0', 'VoltageBoost', 'محافظت در برابر اضافه بار'],
                ],
                'seo_description' => 'پاوربانک انکر PowerCore 20000mAh با ظرفیت بالا، قابلیت شارژ همزمان دو دستگاه را دارد. مجهز به تکنولوژی PowerIQ 2.0 برای تشخیص هوشمند دستگاه و ارائه سریع‌ترین سرعت شارژ. دارای سیستم محافظت چندگانه در برابر اضافه بار، اتصال کوتاه و دمای بالا. وزن سبک 356 گرم، ایده‌آل برای سفر و استفاده روزمره.',
                'images' => [
                    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1609091836318-7e63c40808ad?w=400&h=400&fit=crop',
                ],
                'price' => 1850000,
                'stock_quantity' => 78,
            ],
            [
                'base_name' => 'قاب سیلیکونی آیفون 15 پرو مکس',
                'category_slug' => 'accessories/phone-cases',
                'brand_slug' => 'apple',
                'technical_specs' => [
                    'material' => 'سیلیکون مایع درجه یک',
                    'compatibility' => 'iPhone 15 Pro Max',
                    'features' => ['MagSafe Compatible', 'ضد اثر انگشت', 'جذب ضربه'],
                    'colors' => ['Lavender', 'Storm Blue', 'Pink Sand', 'Black'],
                    'weight' => '42 گرم',
                ],
                'seo_description' => 'قاب سیلیکونی اصلی اپل برای آیفون 15 پرو مکس، ساخته شده از سیلیکون مایع درجه یک با احساس نرم و لطیف. کاملاً سازگار با MagSafe برای شارژ بی‌سیم سریع. طراحی نازک و سبک تنها 42 گرم، محافظت عالی در برابر ضربه و خط و خش. موجود در رنگ‌های متنوع Lavender، Storm Blue، Pink Sand و Black.',
                'images' => [
                    'https://images.unsplash.com/photo-1603351154351-5cf99bc75417?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1556656793-02715d8dd6f8?w=400&h=400&fit=crop',
                ],
                'price' => 1250000,
                'stock_quantity' => 120,
            ],
            [
                'base_name' => 'کابل شارژ تایپ سی به لایتنینگ انکر',
                'category_slug' => 'accessories/cables',
                'brand_slug' => 'anker',
                'technical_specs' => [
                    'length' => '1.8 متر',
                    'connector_1' => 'USB-C',
                    'connector_2' => 'Lightning',
                    'power_delivery' => '20W PD',
                    'material' => 'TPE با روکش نایلون',
                    'certification' => 'MFi Certified',
                ],
                'seo_description' => 'کابل شارژ انکر USB-C به Lightning با طول 1.8 متر، مجهز به تکنولوژی Power Delivery برای شارژ سریع تا 20 وات. دارای گواهینامه MFi اپل، تضمین سازگاری کامل با تمام دستگاه‌های آیفون. روکش نایلونی مقاوم در برابر گره خوردگی و پارگی، بیش از 12000 بار خم شدن را تحمل می‌کند.',
                'images' => [
                    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1615456274775-1ca7dc7415cc?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=400&fit=crop',
                ],
                'price' => 450000,
                'stock_quantity' => 200,
            ],
            [
                'base_name' => 'هندزفری بلوتوثی شیائومی Redmi Buds 4 Pro',
                'category_slug' => 'audio/wireless-earbuds',
                'brand_slug' => 'xiaomi',
                'technical_specs' => [
                    'driver_size' => '11mm Dynamic',
                    'anc' => 'Active Noise Cancellation up to 43dB',
                    'battery_life' => '9 hours (ANC off), 6 hours (ANC on)',
                    'case_battery' => '36 hours total',
                    'bluetooth' => '5.3',
                    'water_resistance' => 'IP54',
                    'codec_support' => ['AAC', 'SBC', 'LDAC'],
                ],
                'seo_description' => 'هندزفری بلوتوثی شیائومی Redmi Buds 4 Pro با حذف نویز فعال تا 43 دسی‌بل، تجربه شنیداری بی‌نظیری ارائه می‌دهد. درایور 11 میلی‌متری داینامیک، کیفیت صدای استریو با باس عمیق تولید می‌کند. باتری با دوام 9 ساعت (بدون ANC) و کیس شارژ با 36 ساعت استفاده مداوم. بلوتوث 5.3 برای اتصال پایدار، مقاومت IP54 در برابر آب و گرد و غبار.',
                'images' => [
                    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1610439911931-fac8e63d04e5?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400&h=400&fit=crop',
                ],
                'price' => 2100000,
                'stock_quantity' => 65,
            ],
        ];
    }

    /**
     * Generate extended catalog with variations
     * 
     * @param int $count Number of products to generate
     * @return array
     */
    public static function generateExtendedCatalog(int $count = 200): array
    {
        $sampleProducts = self::getSampleProducts();
        $categories = [
            'accessories/phone-cases',
            'accessories/screen-protectors',
            'accessories/power-bank',
            'accessories/chargers',
            'accessories/cables',
            'accessories/laptop-bags',
            'audio/wireless-earbuds',
            'audio/headphones',
            'audio/speakers',
            'smartwatch/bands',
            'smartwatch/chargers',
        ];
        
        $brands = ['apple', 'samsung', 'xiaomi', 'anker', 'baseus', 'ugreen', 'spigen', 'otterbox'];
        
        $products = [];
        
        // Add sample products first
        foreach ($sampleProducts as $product) {
            $products[] = $product;
        }
        
        // Generate additional products
        for ($i = count($sampleProducts); $i < $count; $i++) {
            $category = $categories[array_rand($categories)];
            $brand = $brands[array_rand($brands)];
            
            $products[] = [
                'base_name' => "محصول نمونه شماره {$i}",
                'category_slug' => $category,
                'brand_slug' => $brand,
                'technical_specs' => [
                    'model' => "MOD-" . strtoupper(substr(md5($i), 0, 8)),
                    'weight' => fake()->randomFloat(2, 0.1, 2.0) . ' kg',
                    'dimensions' => fake()->numerify('###x###x## mm'),
                ],
                'seo_description' => "توضیحات سئو برای محصول شماره {$i}. این محصول با کیفیت بالا و قیمت مناسب، گزینه‌ای عالی برای خریداران محسوب می‌شود.",
                'images' => [
                    "https://picsum.photos/seed/{$i}/400/400",
                    "https://picsum.photos/seed/" . ($i + 1000) . "/400/400",
                    "https://picsum.photos/seed/" . ($i + 2000) . "/400/400",
                ],
                'price' => fake()->numberBetween(50000, 5000000),
                'stock_quantity' => fake()->numberBetween(0, 200),
            ];
        }
        
        return $products;
    }
}
