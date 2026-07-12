<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Brand;
use App\Models\PhoneSeries;
use App\Models\PhoneModel;
use Illuminate\Support\Str;

class SeedPhoneModels extends Command
{
    protected $signature = 'app:seed-phones';
    protected $description = 'Seed phone brands, series and models';

    public function handle()
    {
        $this->info('🚀 شروع پر کردن داده‌های گوشی...');
        
        // داده‌های کامل
        $data = [
            'Apple' => [
                'iPhone 15' => ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'],
                'iPhone 14' => ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14'],
                'iPhone 13' => ['iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini'],
                'iPhone 12' => ['iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini'],
                'iPhone 11' => ['iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11'],
                'iPhone SE' => ['iPhone SE 2022', 'iPhone SE 2020'],
            ],
            'Samsung' => [
                'Galaxy S24' => ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24'],
                'Galaxy S23' => ['Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23'],
                'Galaxy S22' => ['Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22'],
                'Galaxy S21' => ['Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21'],
                'Galaxy A55' => ['Galaxy A55'],
                'Galaxy A54' => ['Galaxy A54'],
                'Galaxy A35' => ['Galaxy A35'],
                'Galaxy A15' => ['Galaxy A15'],
                'Galaxy Z Fold' => ['Galaxy Z Fold 5', 'Galaxy Z Fold 4'],
                'Galaxy Z Flip' => ['Galaxy Z Flip 5', 'Galaxy Z Flip 4'],
            ],
            'Xiaomi' => [
                'Xiaomi 14' => ['Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 14 Ultra'],
                'Xiaomi 13' => ['Xiaomi 13 Pro', 'Xiaomi 13', 'Xiaomi 13 Lite'],
                'Redmi Note 13' => ['Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13'],
                'Redmi Note 12' => ['Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12'],
                'POCO X6' => ['POCO X6 Pro', 'POCO X6'],
                'POCO F5' => ['POCO F5 Pro', 'POCO F5'],
            ],
            'Huawei' => [
                'P60' => ['P60 Pro', 'P60'],
                'P50' => ['P50 Pro', 'P50'],
                'Mate 60' => ['Mate 60 Pro', 'Mate 60'],
                'Nova 11' => ['Nova 11 Pro', 'Nova 11'],
            ],
            'Google' => [
                'Pixel 8' => ['Pixel 8 Pro', 'Pixel 8'],
                'Pixel 7' => ['Pixel 7 Pro', 'Pixel 7'],
                'Pixel 6' => ['Pixel 6 Pro', 'Pixel 6'],
            ],
            'OnePlus' => [
                'OnePlus 12' => ['OnePlus 12'],
                'OnePlus 11' => ['OnePlus 11'],
                'OnePlus Nord' => ['OnePlus Nord 3', 'OnePlus Nord CE 3'],
            ],
        ];

        $seriesCount = 0;
        $modelCount = 0;

        foreach ($data as $brandName => $seriesData) {
            $brand = Brand::where('name', $brandName)->first();
            
            if (!$brand) {
                $this->warn("⚠️  برند {$brandName} یافت نشد، ساخت برند جدید...");
                $brand = Brand::create([
                    'name' => $brandName,
                    'slug' => Str::slug($brandName),
                    'is_active' => true,
                ]);
            }

            foreach ($seriesData as $seriesName => $models) {
                $series = PhoneSeries::updateOrCreate(
                    ['slug' => Str::slug($seriesName)],
                    [
                        'brand_id' => $brand->id,
                        'name' => $seriesName,
                        'is_active' => true,
                    ]
                );
                $seriesCount++;

                foreach ($models as $modelName) {
                    PhoneModel::updateOrCreate(
                        ['slug' => Str::slug($modelName)],
                        [
                            'brand_id' => $brand->id,
                            'series_id' => $series->id,
                            'name' => $modelName,
                            'is_active' => true,
                        ]
                    );
                    $modelCount++;
                }
            }
        }

        // به‌روزرسانی models_count در series
        PhoneSeries::withCount('models')->get()->each(function ($series) {
            $series->update(['models_count' => $series->models_count]);
        });

        $this->newLine();
        $this->info("✅ پر کردن داده‌ها کامل شد!");
        $this->info("📱 Series: {$seriesCount}");
        $this->info("📲 Models: {$modelCount}");
        
        return 0;
    }
}