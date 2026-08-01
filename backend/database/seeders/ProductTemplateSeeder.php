<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceModel;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // ۱. اطمینان از وجود دسته‌بندی و برند پایه
        $category = Category::first() ?? Category::create(['name' => 'لوازم جانبی موبایل', 'slug' => 'mobile-accessories', 'is_active' => true]);
        $brand = Brand::first() ?? Brand::create(['name' => 'اسپیسیت', 'slug' => 'spigen', 'is_active' => true]);
        
        // ۲. دریافت تصادفی ۳ مدل دستگاه برای اتصال به محصولات
        $deviceModels = DeviceModel::inRandomOrder()->take(3)->pluck('id');

        if ($deviceModels->isEmpty()) {
            $this->command->warn('⚠️ هیچ DeviceModelای در دیتابیس یافت نشد. لطفاً ابتدا Seeder دستگاه‌ها را اجرا کنید.');
            return;
        }

        $templates = [
            [
                'name' => 'قاب محافظ ژله‌ای شفاف Ultra Hybrid',
                'slug' => 'ultra-hybrid-clear-case',
                'short_description' => 'محافظت عالی با طراحی شفاف که زیبایی گوشی شما را پنهان نمی‌کند.',
                'description' => 'این قاب با ترکیب پلی‌کربنات سخت و TPU نرم، حداکثر محافظت را در برابر ضربه و خط و خش ارائه می‌دهد. فناوری Air Cushion در چهار گوشه، جذب شوک را تضمین می‌کند.',
                'price' => 450000,
                'compare_price' => 600000,
                'stock' => 100,
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'specifications' => [
                    'جنس' => 'TPU + پلی‌کربنات',
                    'ویژگی خاص' => 'ضد زردشدگی، فناوری Air Cushion',
                    'پشتیبانی از شارژ وایرلس' => 'بله',
                    'وزن' => '35 گرم'
                ],
                'gallery' => [
                    'https://images.unsplash.com/photo-1603351154351-7c676f7ff4e1?w=800&h=800&fit=crop',
                    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop'
                ],
                'device_model_ids' => $deviceModels->toArray(),
            ],
            [
                'name' => 'محافظ صفحه نمایش شیشه‌ای Tempered Glass',
                'slug' => 'tempered-glass-screen-protector',
                'short_description' => 'شفافیت کریستالی و مقاومت 9H در برابر خط و خش.',
                'description' => 'با سختی 9H، این محافظ صفحه از نمایشگر گوشی شما در برابر کلید، سکه و افتادن محافظت می‌کند. پوشش اولئوفوبیک اثر انگشت را به حداقل می‌رساند.',
                'price' => 180000,
                'compare_price' => 250000,
                'stock' => 200,
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'specifications' => [
                    'سختی' => '9H',
                    'ضخامت' => '0.33 میلی‌متر',
                    'پوشش' => 'اولئوفوبیک (ضد اثر انگشت)'
                ],
                'gallery' => [
                    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop'
                ],
                'device_model_ids' => $deviceModels->toArray(),
            ],
            [
                'name' => 'پاوربانک ۲۰۰۰۰ میلی‌آمپر فست شارژ',
                'slug' => '20000mah-fast-charging-powerbank',
                'short_description' => 'شارژ سریع و ظرفیت بالا برای استفاده در سفر.',
                'description' => 'دارای دو پورت خروجی USB و یک پورت Type-C با پشتیبانی از فناوری Power Delivery برای شارژ سریع گوشی‌های هوشمند.',
                'price' => 850000,
                'compare_price' => 1200000,
                'stock' => 50,
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'specifications' => [
                    'ظرفیت' => '20000 میلی‌آمپر ساعت',
                    'تعداد پورت' => '3 عدد (2x USB, 1x Type-C)',
                    'توان خروجی' => '22.5 وات'
                ],
                'gallery' => [
                    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop'
                ],
                'device_model_ids' => $deviceModels->toArray(),
            ]
        ];

        $createdCount = 0;

        foreach ($templates as $templateData) {
            // ✅ بررسی وجود تمپلیت برای جلوگیری از خطای Duplicate Entry (Idempotent)
            $exists = Product::where('slug', $templateData['slug'])->whereNull('seller_id')->exists();
            
            if ($exists) {
                $this->command->info("⏭️ تمپلیت '{$templateData['name']}' از قبل وجود دارد. در حال رد شدن...");
                continue;
            }

            $deviceIds = $templateData['device_model_ids'];
            unset($templateData['device_model_ids']);

            // ایجاد محصول تمپلیت (بدون seller_id)
            $product = Product::create(array_merge($templateData, [
                'seller_id' => null, 
                'is_active' => true,
                'views_count' => rand(100, 500),
                'sales_count' => rand(10, 50),
            ]));

            // اتصال به دستگاه‌ها
            $product->deviceModels()->sync($deviceIds);
            $createdCount++;
        }

        if ($createdCount > 0) {
            $this->command->info("✅ کتابخانه محصولات آماده: تعداد {$createdCount} محصول جدید با موفقیت و با جزئیات کامل ایجاد شد!");
        } else {
            $this->command->info("ℹ️ همه تمپلیت‌ها از قبل در دیتابیس موجود بودند.");
        }
    }
}