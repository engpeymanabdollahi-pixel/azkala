<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 شروع فرآیند Seed کردن دیتابیس ازکالا...');

        // ۰. تنظیمات سایت (نام، لوگو، تماس، شبکه‌های اجتماعی، پرداخت، ارسال...).
        // هدر و فوتر مستقیماً از GET /site-settings تغذیه می‌شوند؛ بدون این
        // Seeder آن مسیر همیشه خالی برمی‌گشت (تا وقتی ادمین خودش دکمه‌ی
        // «بازگرداندن پیش‌فرض‌ها» را در پنل تنظیمات پیدا و کلیک کند).
        $this->call([
            SettingSeeder::class,
        ]);

        // ✅ نقش‌ها/Permission های Administrative Access (Super Admin/
        // Admin/Manager) — زیرساخت لازم برای EnsurePermission middleware؛
        // بدون این Seeder، هر چک permission روی یک دیتابیس تازه با «هیچ
        // نقشی موجود نیست» شکست می‌خورد.
        $this->call([
            AdministrativeAccessSeeder::class,
        ]);

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
            // 📦 محصولات جدید لوازم‌جانبی (۱۴ محصول) — بعد از محصولات پایه.
            AdditionalProductsSeeder::class,
            // 🖼️ تصاویر اختصاصی برای همه‌ی محصولات (قدیم + جدید).
            // باید آخرِ محصولات بیاید تا محصولات هر دو سیدر را پوشش دهد.
            ProductImageSeeder::class,
        ]);

        // ۴. مقالات مجله از فایل export دیتابیس
        $this->call([
            MagazineArticleSeeder::class,
        ]);

        $this->command->info('🎉 دیتابیس با موفقیت و به طور کامل پر شد!');
    }
}
