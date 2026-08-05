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

        // ۳. سپس محصولات جامع و کوپن‌ها
        $this->call([
            MasterProductSeeder::class,   // ✅ Seeder جدید با محصولات واقعی و مشخصات فنی
            ProductSeeder::class,
            AddMissingProductsSeeder::class,
            CouponSeeder::class,
        ]);

        $this->command->info('🎉 دیتابیس با موفقیت و به طور کامل پر شد!');
    }
}