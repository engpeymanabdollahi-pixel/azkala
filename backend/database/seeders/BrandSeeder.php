<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏷️ در حال ساخت یا به‌روزرسانی برندها...');

        $brands = [
            ['name' => 'Samsung', 'description' => 'Samsung Electronics'],
            ['name' => 'Apple', 'description' => 'Apple Inc.'],
            ['name' => 'Xiaomi', 'description' => 'Xiaomi Corporation'],
            ['name' => 'Huawei', 'description' => 'Huawei Technologies'],
            ['name' => 'Anker', 'description' => 'Anker Innovations'],
            ['name' => 'Baseus', 'description' => 'Baseus Accessories'],
            ['name' => 'Nillkin', 'description' => 'Nillkin Accessories'],
            ['name' => 'Sony', 'description' => 'Sony Corporation'],
            ['name' => 'LG', 'description' => 'LG Electronics'],
            ['name' => 'Honor', 'description' => 'Honor Brand'],
        ];

        foreach ($brands as $brand) {
            // ✅ استفاده از updateOrCreate برای جلوگیری از خطای تکراری بودن slug
            Brand::updateOrCreate(
                ['slug' => Str::slug($brand['name'], '-')], // شرط جستجو
                [
                    'name' => $brand['name'],
                    'description' => $brand['description'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✅ برندها با موفقیت ساخته یا به‌روزرسانی شدند!');
    }
}