<?php

namespace Tests\Feature;

use App\Models\Category;
use Database\Seeders\BrandSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ComprehensiveProductTemplateSeeder;
use Database\Seeders\DeviceHierarchySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * سیدر کتابخانه‌ی محصولات آماده (تمپلیت).
 *
 * نسخه‌ی اول این سیدر با اسلاگ انگلیسیِ فرضی («phone-cases») دسته‌بندی را پیدا
 * می‌کرد، در حالی که CategorySeeder اسلاگ را با Str::slug() از نام فارسی
 * می‌سازد («kab-o-kaor»). نتیجه این بود که حتی روی دیتابیسی که کاملاً درست
 * seed شده بود، این سیدر بلافاصله با «ابتدا CategorySeeder را اجرا کنید» خارج
 * می‌شد و هیچ محصولی نمی‌ساخت — بدون خطای PHP، فقط یک پیام که به‌نظر می‌رسید
 * مشکل از ترتیب اجراست، نه از خودِ این فایل.
 *
 * این تست دقیقاً همان مسیر واقعی (CategorySeeder → BrandSeeder →
 * DeviceHierarchySeeder → این سیدر) را اجرا می‌کند، نه یک دیتابیس دستی‌ساز،
 * چون خودِ اسم‌های واقعی است که اینجا محل خطاست.
 */
class ComprehensiveProductTemplateSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_template_products_against_the_real_category_and_brand_seeders(): void
    {
        $this->seed(CategorySeeder::class);
        $this->seed(BrandSeeder::class);
        $this->seed(DeviceHierarchySeeder::class);
        $this->seed(ComprehensiveProductTemplateSeeder::class);

        $templateCount = DB::table('products')->whereNull('seller_id')->count();

        $this->assertGreaterThan(
            10,
            $templateCount,
            'سیدر هیچ محصول تمپلیتی نساخت — احتمالاً یکی از جستجوهای دسته‌بندی یا برند با نام واقعی مطابقت ندارد.'
        );

        // هر هفت دسته‌بندیِ هدف باید حداقل یک محصول تمپلیت داشته باشد؛ اگر یکی
        // صفر بود یعنی جستجوی همان یکی دارد شکست می‌خورد، حتی اگر بقیه درست
        // باشند و مجموع تست بالا را قبول کند.
        $targetCategoryNames = [
            'قاب و کاور',
            'گلس و محافظ صفحه',
            'شارژر و کابل',
            'هندزفری و هدفون',
            'پاوربانک',
            'ساعت هوشمند',
            'هولدر و پایه',
        ];

        foreach ($targetCategoryNames as $name) {
            $category = Category::where('name', $name)->first();
            $this->assertNotNull($category, "دسته‌بندی «{$name}» توسط CategorySeeder ساخته نشد.");

            $count = DB::table('products')
                ->whereNull('seller_id')
                ->where('category_id', $category->id)
                ->count();

            $this->assertGreaterThan(0, $count, "هیچ محصول تمپلیتی برای دسته‌بندی «{$name}» ساخته نشد.");
        }
    }

    public function test_running_it_twice_does_not_duplicate_or_error(): void
    {
        $this->seed(CategorySeeder::class);
        $this->seed(BrandSeeder::class);
        $this->seed(DeviceHierarchySeeder::class);
        $this->seed(ComprehensiveProductTemplateSeeder::class);

        $firstRunCount = DB::table('products')->whereNull('seller_id')->count();

        $this->seed(ComprehensiveProductTemplateSeeder::class);

        $secondRunCount = DB::table('products')->whereNull('seller_id')->count();

        $this->assertSame($firstRunCount, $secondRunCount);
    }
}
