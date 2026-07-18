<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📂 در حال ساخت یا به‌روزرسانی دسته‌بندی‌ها...');

        $categories = [
            [
                'name' => 'قاب و کاور',
                'icon' => 'shield',
                'description' => 'انواع قاب و کاور گوشی',
                'children' => ['قاب سیلیکونی', 'قاب چرمی', 'قاب ضدضربه', 'قاب شفاف']
            ],
            [
                'name' => 'گلس و محافظ صفحه',
                'icon' => 'screen',
                'description' => 'محافظ صفحه نمایش',
                'children' => ['گلس تمام چسب', 'گلس سرامیکی', 'گلس حریم خصوصی', 'گلس مات']
            ],
            [
                'name' => 'شارژر و کابل',
                'icon' => 'charger',
                'description' => 'شارژر و کابل‌های شارژ',
                'children' => ['شارژر دیواری', 'شارژر فندکی', 'کابل USB', 'کابل تایپ سی', 'شارژر بی‌سیم']
            ],
            [
                'name' => 'هندزفری و هدفون',
                'icon' => 'headphones',
                'description' => 'هندزفری و هدفون',
                'children' => ['هندزفری بلوتوثی', 'هدفون', 'ایرپاد', 'هندزفری سیمی']
            ],
            [
                'name' => 'پاوربانک',
                'icon' => 'battery',
                'description' => 'باتری همراه',
                'children' => ['پاوربانک 10000', 'پاوربانک 20000', 'پاوربانک فست شارژ']
            ],
            [
                'name' => 'ساعت هوشمند',
                'icon' => 'watch',
                'description' => 'ساعت و مچبند هوشمند',
                'children' => ['اپل واچ', 'سامسونگ گلکسی واچ', 'شیائومی می بند']
            ],
            [
                'name' => 'هولدر و پایه',
                'icon' => 'holder',
                'description' => 'پایه و نگهدارنده گوشی',
                'children' => ['هولدر ماشین', 'هولدر رومیزی', 'پایه دوربین']
            ],
            [
                'name' => 'قطعات تعمیراتی',
                'icon' => 'tools',
                'description' => 'قطعات برای تعمیر گوشی',
                'children' => ['ال سی دی', 'باتری', 'تاچ', 'فلکس']
            ],
        ];

        foreach ($categories as $categoryData) {
            // ✅ استفاده از updateOrCreate برای جلوگیری از خطای تکراری بودن slug
            $parent = Category::updateOrCreate(
                ['slug' => Str::slug($categoryData['name'], '-')], // شرط جستجو
                [
                    'name' => $categoryData['name'],
                    'icon' => $categoryData['icon'],
                    'description' => $categoryData['description'],
                    'is_active' => true,
                    'parent_id' => null,
                ]
            );

            foreach ($categoryData['children'] as $childName) {
                Category::updateOrCreate(
                    ['slug' => Str::slug($childName, '-')], // شرط جستجو
                    [
                        'name' => $childName,
                        'parent_id' => $parent->id,
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('✅ دسته‌بندی‌ها با موفقیت ساخته یا به‌روزرسانی شدند!');
    }
}