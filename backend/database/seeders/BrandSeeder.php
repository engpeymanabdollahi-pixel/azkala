<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
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
            Brand::create([
                'name' => $brand['name'],
                'slug' => Str::slug($brand['name'], '-'),
                'description' => $brand['description'],
                'is_active' => true,
            ]);
        }
    }
}