<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Brand;
use App\Models\Category;
use Database\Data\BrandsData;

class BrandsAndCategoriesSeeder extends Seeder
{
    /**
     * اجرای سکدر برندها و دسته‌بندی‌ها با الگوی Upsert
     * 
     * @return void
     */
    public function run(): void
    {
        $this->command->info('📦 در حال وارد کردن برندها و دسته‌بندی‌ها...');

        // 1. وارد کردن برندها
        $brands = BrandsData::getBrands();
        $brandsCount = 0;

        foreach ($brands as $brandData) {
            Brand::updateOrCreate(
                ['slug' => $brandData['slug']],
                [
                    'name' => $brandData['name'],
                    'logo_url' => $brandData['logo_url'],
                    'description_short' => $brandData['description_short'],
                    'is_featured' => $brandData['is_featured'],
                ]
            );
            $brandsCount++;
        }

        $this->command->info("✅ {$brandsCount} برند با موفقیت وارد/آپدیت شدند.");

        // 2. ایجاد ساختار درختی دسته‌بندی‌ها
        $categories = $this->getCategoriesTree();
        $categoriesCount = 0;

        foreach ($categories as $categoryData) {
            Category::updateOrCreate(
                ['slug' => $categoryData['slug']],
                [
                    'name' => $categoryData['name'],
                    'parent_id' => $categoryData['parent_id'] ?? null,
                    'description' => $categoryData['description'] ?? null,
                    'icon' => $categoryData['icon'] ?? null,
                    'is_active' => true,
                    'sort_order' => $categoryData['sort_order'] ?? 0,
                ]
            );
            $categoriesCount++;
        }

        $this->command->info("✅ {$categoriesCount} دسته‌بندی با موفقیت وارد/آپدیت شدند.");
    }

    /**
     * دریافت ساختار درختی دسته‌بندی‌ها
     * 
     * @return array
     */
    private function getCategoriesTree(): array
    {
        return [
            // دسته‌بندی‌های اصلی (ریشه)
            [
                'name' => 'لوازم جانبی موبایل',
                'slug' => 'mobile-accessories',
                'parent_id' => null,
                'description' => 'تمامی لوازم جانبی مورد نیاز برای گوشی‌های موبایل',
                'icon' => 'mobile-phone',
                'sort_order' => 1,
            ],
            [
                'name' => 'قاب و کاور گوشی',
                'slug' => 'mobile-accessories/cases',
                'parent_id' => null, // بعداً با کوئری اصلاح می‌شود یا به صورت دستی parent_id تنظیم شود
                'description' => 'انواع قاب، کاور و محافظ گوشی برای برندهای مختلف',
                'icon' => 'shield',
                'sort_order' => 1,
            ],
            [
                'name' => 'محافظ صفحه نمایش',
                'slug' => 'mobile-accessories/screen-protectors',
                'parent_id' => null,
                'description' => 'گلس و محافظ‌های صفحه نمایش ضد ضربه و ضد خش',
                'icon' => 'eye',
                'sort_order' => 2,
            ],
            [
                'name' => 'شارژر و آداپتور',
                'slug' => 'accessories/charger',
                'parent_id' => null,
                'description' => 'شارژر دیواری، آداپتورهای سریع و اورجینال',
                'icon' => 'zap',
                'sort_order' => 3,
            ],
            [
                'name' => 'کابل شارژ',
                'slug' => 'accessories/cable',
                'parent_id' => null,
                'description' => 'کابل‌های Lightning، USB-C و Micro-USB با کیفیت بالا',
                'icon' => 'usb',
                'sort_order' => 4,
            ],
            [
                'name' => 'پاوربانک',
                'slug' => 'accessories/power-bank',
                'parent_id' => null,
                'description' => 'پاوربانک‌های ظرفیت بالا با قابلیت شارژ سریع',
                'icon' => 'battery-charging',
                'sort_order' => 5,
            ],
            [
                'name' => 'هدفون و هندزفری',
                'slug' => 'audio/headphones',
                'parent_id' => null,
                'description' => 'هدفون‌های بی‌سیم، سیمی و اسپرت با کیفیت صوتی عالی',
                'icon' => 'headphones',
                'sort_order' => 6,
            ],
            [
                'name' => 'اسپیکر بلوتوثی',
                'slug' => 'audio/speakers',
                'parent_id' => null,
                'description' => 'اسپیکرهای قابل حمل با اتصال بلوتوث',
                'icon' => 'speaker',
                'sort_order' => 7,
            ],
            [
                'name' => 'ساعت هوشمند و مچ‌بند',
                'slug' => 'wearables/smartwatch',
                'parent_id' => null,
                'description' => 'ساعت‌های هوشمند و مچ‌بندهای fitness tracker',
                'icon' => 'watch',
                'sort_order' => 8,
            ],
            [
                'name' => 'مچ‌بند هوشمند',
                'slug' => 'wearables/smart-band',
                'parent_id' => null,
                'description' => 'مچ‌بندهای سلامتی و ورزشی با امکانات متنوع',
                'icon' => 'activity',
                'sort_order' => 9,
            ],
            [
                'name' => 'لوازم جانبی لپ‌تاپ',
                'slug' => 'laptop-accessories',
                'parent_id' => null,
                'description' => 'کیف، کوله، هاب، دانگل و سایر لوازم جانبی لپ‌تاپ',
                'icon' => 'monitor',
                'sort_order' => 10,
            ],
            [
                'name' => 'هاب و مبدل',
                'slug' => 'laptop-accessories/hubs',
                'parent_id' => null,
                'description' => 'هاب‌های USB-C، HDMI و مبدل‌های چندکاره',
                'icon' => 'cpu',
                'sort_order' => 11,
            ],
            [
                'name' => 'نگهدارنده و پایه',
                'slug' => 'accessories/holders',
                'parent_id' => null,
                'description' => 'پایه‌های رومیزی، نگهدارنده‌های خودرو و سه‌پایه',
                'icon' => 'anchor',
                'sort_order' => 12,
            ],
            [
                'name' => 'لوازم جانبی خودرو',
                'slug' => 'car-accessories',
                'parent_id' => null,
                'description' => 'شارژر فندکی، هولدر و تجهیزات جانبی خودرو',
                'icon' => 'truck',
                'sort_order' => 13,
            ],
            [
                'name' => 'گیمرینگ',
                'slug' => 'gaming',
                'parent_id' => null,
                'description' => 'دسته بازی، کیبورد، موس و تجهیزات گیمینگ',
                'icon' => 'gamepad',
                'sort_order' => 14,
            ],
        ];
    }
}
