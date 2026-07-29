<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DeviceTestDataSeeder extends Seeder
{
    public function run()
    {
        // ۱. ساخت برندها
        $appleId = DB::table('device_brands')->insertGetId([
            'name' => 'Apple',
            'slug' => 'apple',
            'type' => 'mobile',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $samsungId = DB::table('device_brands')->insertGetId([
            'name' => 'Samsung',
            'slug' => 'samsung',
            'type' => 'mobile',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ۲. ساخت سری‌ها
        $iphoneSeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $appleId,
            'name' => 'iPhone',
            'slug' => 'iphone',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $galaxySeriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $samsungId,
            'name' => 'Galaxy',
            'slug' => 'galaxy',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ۳. ساخت مدل‌ها
        DB::table('device_models')->insert([
            [
                'series_id' => $iphoneSeriesId, 
                'name' => 'iPhone 13', 
                'slug' => 'iphone-13', 
                'is_active' => true, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'series_id' => $iphoneSeriesId, 
                'name' => 'iPhone 14 Pro', 
                'slug' => 'iphone-14-pro', 
                'is_active' => true, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'series_id' => $galaxySeriesId, 
                'name' => 'Galaxy S23', 
                'slug' => 'galaxy-s23', 
                'is_active' => true, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
        ]);
    }
}