<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReadyProductsSeeder extends Seeder
{
    public function run()
    {
        // دریافت دسته‌بندی‌های موجود
        $accessoryCategory = DB::table('categories')->where('slug', 'mobile-accessories')->first();
        $caseCategory = DB::table('categories')->where('slug', 'phone-cases')->first();
        
        // اگر دسته‌بندی‌ها وجود ندارند، می‌سازیم
        if (!$accessoryCategory) {
            $accessoryCategoryId = DB::table('categories')->insertGetId([
                'name' => 'لوازم جانبی موبایل',
                'slug' => 'mobile-accessories',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $accessoryCategoryId = $accessoryCategory->id;
        }

        if (!$caseCategory) {
            $caseCategoryId = DB::table('categories')->insertGetId([
                'name' => 'قاب و کاور گوشی',
                'slug' => 'phone-cases',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $caseCategoryId = $caseCategory->id;
        }

        // دریافت برندهای محصول (برندهای لوازم جانبی)
        $spigenId = DB::table('brands')->insertGetId([
            'name' => 'اسپایگن',
            'slug' => 'spigen',
            'logo' => 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=200&h=200&fit=crop',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ankerId = DB::table('brands')->insertGetId([
            'name' => 'انکر',
            'slug' => 'anker',
            'logo' => 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=200&h=200&fit=crop',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // دریافت مدل‌های دستگاه
        $iphone13Model = DB::table('device_models')->where('slug', 'iphone-13')->first();
        $iphone14ProModel = DB::table('device_models')->where('slug', 'iphone-14-pro')->first();
        $galaxyS23Model = DB::table('device_models')->where('slug', 'galaxy-s23')->first();

        // ==================== محصولات آماده ====================

        // 1. قاب اسپایگن آیفون ۱۳
        DB::table('products')->insert([
            'category_id' => $caseCategoryId,
            'brand_id' => $spigenId,
            'seller_id' => null, // این محصولات template هستند
            'device_model_id' => $iphone13Model->id,
            'name' => 'قاب سیلیکونی اسپایگن آیفون ۱۳ مدل Ultra Hybrid',
            'slug' => 'spigen-iphone-13-ultra-hybrid-case',
            'short_description' => 'قاب محافظ شفاف با تکنولوژی Air Cushion برای جذب ضربه',
            'description' => '<p>قاب Ultra Hybrid اسپایگن با طراحی شفاف و زیبا، ضمن نمایش زیبایی گوشی آیفون ۱۳ شما، محافظت کاملی در برابر ضربه و خش ارائه می‌دهد.</p><h3>ویژگی‌های کلیدی:</h3><ul><li>تکنولوژی Air Cushion در چهار گوشه</li><li>بک پنل شفاف و مقاوم در برابر زرد شدن</li><li>لبه‌های برآمده برای محافظت از دوربین و صفحه نمایش</li><li>دکمه‌های فیزیکی با پوشش آلومینیومی</li></ul>',
            'specifications' => json_encode([
                'جنس' => 'TPU + Polycarbonate',
                'رنگ' => 'شفاف (Crystal Clear)',
                'وزن' => '45 گرم',
                'ضخامت' => '1.2 میلی‌متر',
                'محافظت' => 'ضد ضربه، ضد خش',
                'سازگاری' => 'iPhone 13',
                'برند' => 'Spigen',
                'گارانتی' => '7 روز ضمانت تعویض',
            ], JSON_UNESCAPED_UNICODE),
            'price' => 450000,
            'compare_price' => 650000,
            'discount_price' => 425000,
            'stock' => 150,
            'sku' => 'SPG-IPH13-UH-001',
            'main_image' => 'https://images.unsplash.com/photo-1603351154351-7c676f7ff4e1?w=800&h=800&fit=crop',
            'gallery' => json_encode([
                'https://images.unsplash.com/photo-1603351154351-7c676f7ff4e1?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
            ], JSON_UNESCAPED_UNICODE),
            'is_active' => true,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. شارژر انکر
        DB::table('products')->insert([
            'category_id' => $accessoryCategoryId,
            'brand_id' => $ankerId,
            'seller_id' => null,
            'device_model_id' => null, // عمومی
            'name' => 'شارژر دیواری انکر 20W مدل PowerPort III Nano',
            'slug' => 'anker-powerport-iii-nano-20w',
            'short_description' => 'شارژر سریع USB-C با تکنولوژی Power Delivery',
            'description' => '<p>شارژر دیواری انکر با توان 20 وات و پشتیبانی از Power Delivery، گوشی آیفون و سایر دستگاه‌های USB-C را با حداکثر سرعت شارژ می‌کند.</p><h3>ویژگی‌ها:</h3><ul><li>توان خروجی 20 وات</li><li>پورت USB-C با Power Delivery 3.0</li><li>اندازه بسیار جمع‌وجور (50% کوچکتر از شارژرهای معمولی)</li><li>سیستم محافظت MultiProtect</li></ul>',
            'specifications' => json_encode([
                'توان' => '20 وات',
                'پورت‌ها' => '1x USB-C',
                'ورودی' => '100-240V ~ 0.6A 50-60Hz',
                'خروجی' => '5V=3A / 9V=2.22A',
                'تکنولوژی' => 'Power Delivery 3.0',
                'ابعاد' => '27 x 27 x 30 میلی‌متر',
                'وزن' => '30 گرم',
                'رنگ' => 'سفید',
                'گارانتی' => '18 ماه گارانتی رسمی',
            ], JSON_UNESCAPED_UNICODE),
            'price' => 380000,
            'compare_price' => 520000,
            'discount_price' => 360000,
            'stock' => 200,
            'sku' => 'ANK-PP3N-20W-WH',
            'main_image' => 'https://images.unsplash.com/photo-1583863788434-e58a36331f07?w=800&h=800&fit=crop',
            'gallery' => json_encode([
                'https://images.unsplash.com/photo-1583863788434-e58a36331f07?w=800&h=800&fit=crop',
            ], JSON_UNESCAPED_UNICODE),
            'is_active' => true,
            'is_bestseller' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. گلس محافظ
        DB::table('products')->insert([
            'category_id' => $caseCategoryId,
            'brand_id' => $spigenId,
            'seller_id' => null,
            'device_model_id' => $galaxyS23Model->id,
            'name' => 'گلس محافظ صفحه نمایش سامسونگ Galaxy S23',
            'slug' => 'galaxy-s23-screen-protector',
            'short_description' => 'گلس شیشه‌ای تمپر با سختی 9H',
            'description' => '<p>گلس محافظ با کیفیت بالا برای Galaxy S23 که از صفحه نمایش گوشی شما در برابر خش و ضربه محافظت می‌کند.</p>',
            'specifications' => json_encode([
                'جنس' => 'شیشه تمپر',
                'سختی' => '9H',
                'ضخامت' => '0.33 میلی‌متر',
                'شفافیت' => '99%',
                'پوشش' => 'اولئوفوبیک (ضد اثر انگشت)',
                'سازگاری' => 'Samsung Galaxy S23',
                'تعداد در بسته' => '2 عدد',
            ], JSON_UNESCAPED_UNICODE),
            'price' => 180000,
            'compare_price' => 280000,
            'stock' => 300,
            'sku' => 'GLS-S23-TP-001',
            'main_image' => 'https://images.unsplash.com/photo-1586105740446-37086e25a7e6?w=800&h=800&fit=crop',
            'gallery' => json_encode([], JSON_UNESCAPED_UNICODE),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. کابل شارژ
        DB::table('products')->insert([
            'category_id' => $accessoryCategoryId,
            'brand_id' => $ankerId,
            'seller_id' => null,
            'device_model_id' => null,
            'name' => 'کابل شارژ انکر USB-C به Lightning 1.8 متر',
            'slug' => 'anker-usbc-lightning-cable-1.8m',
            'short_description' => 'کابل شارژ سریع با پشتیبانی از Power Delivery',
            'description' => '<p>کابل شارژ با کیفیت بالا برای اتصال دستگاه‌های USB-C به iPhone و iPad با پشتیبانی از شارژ سریع.</p>',
            'specifications' => json_encode([
                'نوع کانکتور' => 'USB-C به Lightning',
                'طول' => '1.8 متر',
                'توان' => 'پشتیبانی تا 20W',
                'سرعت انتقال داده' => '480 Mbps',
                'جنس روکش' => 'نایلون بافته شده',
                'رنگ' => 'مشکی',
                'سازگاری' => 'iPhone 8 به بعد، iPad Pro',
                'گارانتی' => '18 ماه',
            ], JSON_UNESCAPED_UNICODE),
            'price' => 290000,
            'compare_price' => 420000,
            'stock' => 250,
            'sku' => 'ANK-USBC-LT-1.8',
            'main_image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
            'gallery' => json_encode([], JSON_UNESCAPED_UNICODE),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}