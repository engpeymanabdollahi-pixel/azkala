<?php

namespace Database\Seeders;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use App\Models\DeviceModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DeviceHierarchySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📱 در حال ساخت یا به‌روزرسانی سلسله‌مراتب دستگاه‌ها (برند > سری > مدل)...');

        $devices = [
            'Samsung' => [
                'Galaxy S' => ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23'],
                'Galaxy A' => ['Galaxy A55', 'Galaxy A54', 'Galaxy A35', 'Galaxy A34'],
                'Galaxy Z' => ['Galaxy Z Fold5', 'Galaxy Z Flip5'],
            ],
            'Apple' => [
                'iPhone 15' => ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'],
                'iPhone 14' => ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14'],
                'iPhone 13' => ['iPhone 13 Pro Max', 'iPhone 13', 'iPhone 13 mini'],
            ],
            'Xiaomi' => [
                'Redmi Note' => ['Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro'],
                'POCO' => ['POCO F5 Pro', 'POCO F5', 'POCO X5 Pro'],
            ],
            'Huawei' => [
                'P Series' => ['P60 Pro', 'P60', 'P50 Pro'],
                'Mate Series' => ['Mate 60 Pro', 'Mate 50 Pro'],
            ]
        ];

        foreach ($devices as $brandName => $seriesData) {
            $brandSlug = Str::slug($brandName);
            
            // ✅ جستجو بر اساس slug یکتا
            $brand = DeviceBrand::updateOrCreate(
                ['slug' => $brandSlug],
                ['name' => $brandName, 'is_active' => true]
            );

            foreach ($seriesData as $seriesName => $models) {
                $seriesSlug = Str::slug($seriesName);
                
                // ✅ جستجو بر اساس slug یکتا
                $series = DeviceSeries::updateOrCreate(
                    ['slug' => $seriesSlug],
                    [
                        'brand_id' => $brand->id,
                        'name' => $seriesName,
                        'is_active' => true
                    ]
                );

                foreach ($models as $modelName) {
                    $modelSlug = Str::slug($modelName);
                    
                    // ✅ جستجو بر اساس slug یکتا (این خط جلوی خطای Duplicate entry را می‌گیرد)
                    DeviceModel::updateOrCreate(
                        ['slug' => $modelSlug],
                        [
                            'series_id' => $series->id,
                            'name' => $modelName,
                            'is_active' => true
                        ]
                    );
                }
            }
        }

        $this->command->info('✅ سلسله‌مراتب دستگاه‌ها با موفقیت ساخته یا به‌روزرسانی شد!');
    }
}