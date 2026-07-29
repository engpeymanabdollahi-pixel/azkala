<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DeviceHierarchySeeder extends Seeder
{
    public function run()
    {
        // ✅ غیرفعال کردن موقت بررسی کلیدهای خارجی برای جلوگیری از خطای Truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // پاک کردن داده‌های قبلی
        DB::table('device_models')->truncate();
        DB::table('device_series')->truncate();
        DB::table('device_brands')->truncate();

        // ✅ فعال کردن مجدد بررسی کلیدهای خارجی
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ==================== موبایل ====================
        
        // Apple (موبایل)
        $appleMobileId = DB::table('device_brands')->insertGetId([
            'name' => 'اپل',
            'slug' => 'apple',
            'type' => 'mobile',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // iPhone Series (بدون فیلد image چون در جدول وجود ندارد)
        $iphoneSeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $appleMobileId,
            'name' => 'آیفون',
            'slug' => 'iphone',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // iPhone Models (با فیلد image)
        DB::table('device_models')->insert([
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۵ پرو مکس', 'slug' => 'iphone-15-pro-max', 'image' => 'https://images.unsplash.com/photo-1695048133142-1a20484d6509?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۵ پرو', 'slug' => 'iphone-15-pro', 'image' => 'https://images.unsplash.com/photo-1695048133142-1a20484d6509?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۵', 'slug' => 'iphone-15', 'image' => 'https://images.unsplash.com/photo-1695048133142-1a20484d6509?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۴ پرو مکس', 'slug' => 'iphone-14-pro-max', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۴ پرو', 'slug' => 'iphone-14-pro', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۴', 'slug' => 'iphone-14', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۳ پرو مکس', 'slug' => 'iphone-13-pro-max', 'image' => 'https://images.unsplash.com/photo-1632661674596-d95a3e56063f?w=400&h=300&fit=crop', 'release_year' => 2021, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۳ پرو', 'slug' => 'iphone-13-pro', 'image' => 'https://images.unsplash.com/photo-1632661674596-d95a3e56063f?w=400&h=300&fit=crop', 'release_year' => 2021, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۳', 'slug' => 'iphone-13', 'image' => 'https://images.unsplash.com/photo-1632661674596-d95a3e56063f?w=400&h=300&fit=crop', 'release_year' => 2021, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $iphoneSeriesId, 'name' => 'آیفون ۱۲ پرو مکس', 'slug' => 'iphone-12-pro-max', 'image' => 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop', 'release_year' => 2020, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Samsung (موبایل)
        $samsungId = DB::table('device_brands')->insertGetId([
            'name' => 'سامسونگ',
            'slug' => 'samsung',
            'type' => 'mobile',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Galaxy Series
        $galaxySeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $samsungId,
            'name' => 'گلکسی',
            'slug' => 'galaxy',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Galaxy Models
        DB::table('device_models')->insert([
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S24 اولترا', 'slug' => 'galaxy-s24-ultra', 'image' => 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&h=300&fit=crop', 'release_year' => 2024, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S24 پلاس', 'slug' => 'galaxy-s24-plus', 'image' => 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&h=300&fit=crop', 'release_year' => 2024, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S24', 'slug' => 'galaxy-s24', 'image' => 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&h=300&fit=crop', 'release_year' => 2024, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S23 اولترا', 'slug' => 'galaxy-s23-ultra', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S23 پلاس', 'slug' => 'galaxy-s23-plus', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S23', 'slug' => 'galaxy-s23', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی S22 اولترا', 'slug' => 'galaxy-s22-ultra', 'image' => 'https://images.unsplash.com/photo-1645389861264-c3f143a6fa38?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی A54', 'slug' => 'galaxy-a54', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxySeriesId, 'name' => 'گلکسی A34', 'slug' => 'galaxy-a34', 'image' => 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ==================== لپ‌تاپ ====================

        // Apple (لپ‌تاپ)
        $appleLaptopId = DB::table('device_brands')->insertGetId([
            'name' => 'اپل',
            'slug' => 'apple-laptop',
            'type' => 'laptop',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // MacBook Series
        $macbookSeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $appleLaptopId,
            'name' => 'مک‌بوک',
            'slug' => 'macbook',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // MacBook Models
        DB::table('device_models')->insert([
            ['series_id' => $macbookSeriesId, 'name' => 'مک‌بوک پرو ۱۶ اینچ M3', 'slug' => 'macbook-pro-16-m3', 'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $macbookSeriesId, 'name' => 'مک‌بوک پرو ۱۴ اینچ M3', 'slug' => 'macbook-pro-14-m3', 'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $macbookSeriesId, 'name' => 'مک‌بوک ایر ۱۵ اینچ M2', 'slug' => 'macbook-air-15-m2', 'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $macbookSeriesId, 'name' => 'مک‌بوک ایر ۱۳ اینچ M2', 'slug' => 'macbook-air-13-m2', 'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Asus (لپ‌تاپ)
        $asusId = DB::table('device_brands')->insertGetId([
            'name' => 'ایسوس',
            'slug' => 'asus',
            'type' => 'laptop',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ZenBook Series
        $zenbookSeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $asusId,
            'name' => 'ZenBook',
            'slug' => 'zenbook',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ZenBook Models
        DB::table('device_models')->insert([
            ['series_id' => $zenbookSeriesId, 'name' => 'ZenBook 14 OLED', 'slug' => 'zenbook-14-oled', 'image' => 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $zenbookSeriesId, 'name' => 'ZenBook Pro 14', 'slug' => 'zenbook-pro-14', 'image' => 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ==================== تبلت ====================

        // Apple (تبلت)
        $appleTabletId = DB::table('device_brands')->insertGetId([
            'name' => 'اپل',
            'slug' => 'apple-tablet',
            'type' => 'tablet',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // iPad Series
        $ipadSeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $appleTabletId,
            'name' => 'آیپد',
            'slug' => 'ipad',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // iPad Models
        DB::table('device_models')->insert([
            ['series_id' => $ipadSeriesId, 'name' => 'آیپد پرو ۱۲.۹ اینچ', 'slug' => 'ipad-pro-12-9', 'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $ipadSeriesId, 'name' => 'آیپد پرو ۱۱ اینچ', 'slug' => 'ipad-pro-11', 'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $ipadSeriesId, 'name' => 'آیپد ایر', 'slug' => 'ipad-air', 'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $ipadSeriesId, 'name' => 'آیپد نسل ۱۰', 'slug' => 'ipad-10th-gen', 'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 'release_year' => 2022, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Samsung (تبلت)
        $samsungTabletId = DB::table('device_brands')->insertGetId([
            'name' => 'سامسونگ',
            'slug' => 'samsung-tablet',
            'type' => 'tablet',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Galaxy Tab Series
        $galaxyTabSeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $samsungTabletId,
            'name' => 'گلکسی تب',
            'slug' => 'galaxy-tab',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Galaxy Tab Models
        DB::table('device_models')->insert([
            ['series_id' => $galaxyTabSeriesId, 'name' => 'گلکسی تب S9 اولترا', 'slug' => 'galaxy-tab-s9-ultra', 'image' => 'https://images.unsplash.com/photo-1561154407-4d4b86e291f3?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxyTabSeriesId, 'name' => 'گلکسی تب S9 پلاس', 'slug' => 'galaxy-tab-s9-plus', 'image' => 'https://images.unsplash.com/photo-1561154407-4d4b86e291f3?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['series_id' => $galaxyTabSeriesId, 'name' => 'گلکسی تب S9', 'slug' => 'galaxy-tab-s9', 'image' => 'https://images.unsplash.com/photo-1561154407-4d4b86e291f3?w=400&h=300&fit=crop', 'release_year' => 2023, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}