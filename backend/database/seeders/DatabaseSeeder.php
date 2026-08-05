<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 شروع فرآیند Seed کردن دیتابیس ازکالا...');

        // ۱. ابتدا کاربران (تا محصولات بتوانند به seller_id متصل شوند)
        $this->call([
            AdminUserSeeder::class,
            SellerUserSeeder::class,
        ]);

        // ۲. سپس دسته‌بندی‌ها و برندها
        $this->call([
            CategorySeeder::class,
            BrandSeeder::class,
            DeviceHierarchySeeder::class, // ✅ این خط مشکل خالی بودن لیست گوشی‌ها را حل می‌کند
        ]);

        // ۳. سپس محصولات و کوپن‌ها
        $this->call([
            ProductSeeder::class,
            AddMissingProductsSeeder::class,
            // seller_id این محصولات null است — یعنی «تمپلیت»اند، نه فروشیِ کسی.
            // GET /products/templates دقیقاً همین ردیف‌ها را برمی‌گرداند تا
            // فروشنده‌ی تازه‌وارد به‌جای شروع از صفر، یکی را کپی کند.
            ComprehensiveProductTemplateSeeder::class,
            CouponSeeder::class,
        ]);

        $this->command->info('🎉 دیتابیس با موفقیت و به طور کامل پر شد!');
    }
}
