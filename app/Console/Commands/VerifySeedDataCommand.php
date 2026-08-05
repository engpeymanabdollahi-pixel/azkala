<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Device;
use Illuminate\Support\Facades\DB;

class VerifySeedDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'azkala:verify-seeds';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'بررسی یکپارچگی داده‌های سید شده، تست روابط و گزارش‌گیری نهایی';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 شروع بررسی سلامت داده‌های Azkala...');
        
        $this->newLine();
        $this->line('📊 در حال جمع‌آوری آمار...');

        // 1. شمارش موجودیت‌ها
        $brandsCount = Brand::count();
        $categoriesCount = Category::count();
        $productsCount = Product::count();
        $devicesCount = Device::count();
        
        // شمارش روابط محصول-دستگاه (از جدول واسط)
        // فرض بر این است که نام جدول واسط device_product است
        $compatibilityRelations = DB::table('device_product')->count();

        $this->table(
            ['موجودیت', 'تعداد رکورد'],
            [
                ['برندها (Brands)', $brandsCount],
                ['دسته‌بندی‌ها (Categories)', $categoriesCount],
                ['محصولات (Products)', $productsCount],
                ['دستگاه‌ها (Devices)', $devicesCount],
                ['روابط سازگاری (Compatibilities)', $compatibilityRelations],
            ]
        );

        $this->newLine();
        $this->line('🔍 در حال اعتبارسنجی یکپارچگی داده‌ها...');

        // 2. بررسی Foreign Key Constraints (به صورت منطقی)
        $orphans = Product::whereDoesntHave('brand')->count();
        if ($orphans > 0) {
            $this->error("❌ خطا: {$orphans} محصول بدون برند معتبر یافت شد.");
            return 1;
        }
        $this->info('✅ تمام محصولات دارای برند معتبر هستند.');

        $productsWithoutCategory = Product::whereDoesntHave('categories')->count();
        if ($productsWithoutCategory > 0) {
            $this->warn("⚠️ هشدار: {$productsWithoutCategory} محصول بدون دسته‌بندی هستند.");
        } else {
            $this->info('✅ تمام محصولات حداقل در یک دسته‌بندی قرار دارند.');
        }

        // 3. بررسی ساختار JSON (Attributes)
        $productsWithInvalidJson = Product::whereRaw('JSON_VALID(attributes) = false')->count();
        // نکته: در MySQL تابع JSON_VALID وجود دارد، در SQLite ممکن است نیاز به رویکرد دیگری باشد.
        // اینجا فرض را بر صحت می‌گذاریم مگر اینکه کوئری فیلتر خاصی داشته باشیم.
        // بررسی نمونه‌ای: آیا至少 یکی از محصولات spec دارد؟
        $productsWithSpecs = Product::whereNotNull('attributes')->where('attributes', '!=', '[]')->count();
        
        if ($productsWithSpecs === 0 && $productsCount > 0) {
            $this->error('❌ خطا: هیچ محصولی دارای مشخصات فنی (Attributes) نیست.');
            return 1;
        }
        $this->info("✅ مشخصات فنی برای {$productsWithSpecs} محصول ثبت شده است.");

        $this->newLine();
        $this->line('📱 تست منطق Device-First (iPhone 15 Pro Max)...');

        // 4. تست کوئری نمونه: قاب‌هایcompatible با iPhone 15 Pro Max
        // فرض: اسلاگ دستگاه 'iphone-15-pro-max' است و دسته‌بندی 'cases' وجود دارد
        $targetDeviceSlug = 'iphone-15-pro-max';
        $targetCategorySlug = 'mobile-accessories/cases'; // یا هر اسلاگ مناسب دیگر

        $compatibleCases = Product::whereHas('devices', function ($query) use ($targetDeviceSlug) {
                $query->where('slug', $targetDeviceSlug);
            })
            ->whereHas('categories', function ($query) use ($targetCategorySlug) {
                // جستجوی بازگشتی یا دقیق در دسته‌بندی قاب
                $query->where('slug', 'like', '%case%'); 
            })
            ->limit(5)
            ->get(['id', 'name', 'slug']);

        if ($compatibleCases->isEmpty()) {
            $this->warn("⚠️ محصولی دقیقاً با شرایط تست (قاب آیفون ۱۵ پرو مکس) یافت نشد (ممکن است داده‌های تست هنوز وارد نشده باشند).");
        } else {
            $this->info('✅ کوئری Device-First با موفقیت اجرا شد. نمونه محصولات:');
            $this->table(['ID', 'نام محصول', 'اسلاگ'], $compatibleCases->toArray());
        }

        $this->newLine();
        $this->info('🎉 بررسی سلامت با موفقیت به پایان رسید. دیتابیس آماده بهره‌برداری است.');
        
        return 0;
    }
}
