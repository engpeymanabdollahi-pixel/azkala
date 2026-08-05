<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Database\Data\BrandsData;
use Database\Data\MasterProductsCatalog;
use Database\Data\DeviceCompatibilityMap;

class MasterDataSeeder extends Seeder
{
    /**
     * اجرای تمام سکدرها به ترتیب صحیح با تراکنش کامل
     * 
     * @return void
     */
    public function run(): void
    {
        $this->command->info('🚀 شروع فرآیند Seed داده‌های Azkala...');
        
        DB::transaction(function () {
            // 1. ابتدا برندها و دسته‌بندی‌ها (نیاز به Foreign Key برای محصولات)
            $this->call([
                BrandsAndCategoriesSeeder::class,
            ]);

            // 2. سپس دستگاه‌ها (برای ارتباط با محصولات)
            $this->call([
                DevicesSeeder::class,
            ]);

            // 3. در نهایت محصولات (که به برندها، دسته‌بندی‌ها و دستگاه‌ها وابسته هستند)
            $this->call([
                ProductsSeeder::class,
            ]);
        });

        // چاپ گزارش نهایی
        $this->printFinalReport();
    }

    /**
     * چاپ گزارش آماری نهایی
     * 
     * @return void
     */
    private function printFinalReport(): void
    {
        $this->command->newLine();
        $this->command->info('📊 ==================== گزارش نهایی Seed ====================');
        
        $brandsCount = \App\Models\Brand::count();
        $categoriesCount = \App\Models\Category::count();
        $productsCount = \App\Models\Product::count();
        $devicesCount = \App\Models\Device::count();
        
        // شمارش روابط محصول-دستگاه
        $compatibilityRelations = DB::table('device_product')->count();

        $this->command->table(
            ['موجودیت', 'تعداد رکورد'],
            [
                ['✅ برندها (Brands)', $brandsCount],
                ['✅ دسته‌بندی‌ها (Categories)', $categoriesCount],
                ['✅ محصولات (Products)', $productsCount],
                ['✅ دستگاه‌ها (Devices)', $devicesCount],
                ['✅ روابط سازگاری (Compatibilities)', $compatibilityRelations],
            ]
        );

        $this->command->newLine();
        
        if ($brandsCount > 0 && $productsCount > 0 && $devicesCount > 0) {
            $this->command->info('🎉 عملیات Seed با موفقیت به پایان رسید!');
            $this->command->info('💡 دیتابیس آماده بهره‌برداری است.');
        } else {
            $this->command->error('❌ خطا: برخی از داده‌ها به درستی وارد نشدند.');
        }
        
        $this->command->info('==========================================================');
    }
}
