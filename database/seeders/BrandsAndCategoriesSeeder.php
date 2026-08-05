<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Database\Seeders\Data\BrandsData;

class BrandsAndCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('📦 Seeding Brands and Categories...');
        
        // Seed Brands using upsert to avoid duplicates
        $brands = BrandsData::getBrands();
        
        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['slug' => $brand['slug']],
                [
                    'name' => $brand['name'],
                    'logo_url' => $brand['logo_url'],
                    'description_short' => $brand['description_short'],
                    'is_featured' => $brand['is_featured'],
                ]
            );
        }
        
        $this->command->info('  ✓ Brands seeded: ' . count($brands));
        
        // Seed Categories Tree
        $this->seedCategories();
    }
    
    /**
     * Seed category tree structure
     */
    private function seedCategories(): void
    {
        $categories = [
            // Main Categories
            [
                'name' => 'لوازم جانبی موبایل',
                'slug' => 'accessories',
                'parent_slug' => null,
                'icon' => 'smartphone',
                'is_active' => true,
            ],
            [
                'name' => 'صدا و هندزفری',
                'slug' => 'audio',
                'parent_slug' => null,
                'icon' => 'headphones',
                'is_active' => true,
            ],
            [
                'name' => 'ساعت هوشمند',
                'slug' => 'smartwatch',
                'parent_slug' => null,
                'icon' => 'watch',
                'is_active' => true,
            ],
            [
                'name' => 'لپ‌تاپ و تبلت',
                'slug' => 'laptop-tablet',
                'parent_slug' => null,
                'icon' => 'laptop',
                'is_active' => true,
            ],
            
            // Accessories Subcategories
            [
                'name' => 'قاب و کاور گوشی',
                'slug' => 'phone-cases',
                'parent_slug' => 'accessories',
                'icon' => 'shield',
                'is_active' => true,
            ],
            [
                'name' => 'محافظ صفحه نمایش',
                'slug' => 'screen-protectors',
                'parent_slug' => 'accessories',
                'icon' => 'layers',
                'is_active' => true,
            ],
            [
                'name' => 'پاوربانک',
                'slug' => 'power-bank',
                'parent_slug' => 'accessories',
                'icon' => 'battery-charging',
                'is_active' => true,
            ],
            [
                'name' => 'شارژر و آداپتور',
                'slug' => 'chargers',
                'parent_slug' => 'accessories',
                'icon' => 'zap',
                'is_active' => true,
            ],
            [
                'name' => 'کابل شارژ',
                'slug' => 'cables',
                'parent_slug' => 'accessories',
                'icon' => 'usb',
                'is_active' => true,
            ],
            [
                'name' => 'کیف و کوله لپ‌تاپ',
                'slug' => 'laptop-bags',
                'parent_slug' => 'accessories',
                'icon' => 'briefcase',
                'is_active' => true,
            ],
            [
                'name' => 'پایه نگهدارنده',
                'slug' => 'holders-stands',
                'parent_slug' => 'accessories',
                'icon' => 'monitor',
                'is_active' => true,
            ],
            
            // Audio Subcategories
            [
                'name' => 'هندزفری بلوتوثی',
                'slug' => 'wireless-earbuds',
                'parent_slug' => 'audio',
                'icon' => 'headphones',
                'is_active' => true,
            ],
            [
                'name' => 'هدفون و هدست',
                'slug' => 'headphones',
                'parent_slug' => 'audio',
                'icon' => 'headset',
                'is_active' => true,
            ],
            [
                'name' => 'اسپیکر بلوتوثی',
                'slug' => 'speakers',
                'parent_slug' => 'audio',
                'icon' => 'volume-2',
                'is_active' => true,
            ],
            
            // Smartwatch Subcategories
            [
                'name' => 'بند ساعت',
                'slug' => 'bands',
                'parent_slug' => 'smartwatch',
                'icon' => 'clock',
                'is_active' => true,
            ],
            [
                'name' => 'شارژر ساعت',
                'slug' => 'chargers',
                'parent_slug' => 'smartwatch',
                'icon' => 'battery',
                'is_active' => true,
            ],
        ];
        
        // First pass: Create parent categories
        $categoryMap = [];
        
        foreach ($categories as $category) {
            if ($category['parent_slug'] === null) {
                $created = Category::updateOrCreate(
                    ['slug' => $category['slug']],
                    [
                        'name' => $category['name'],
                        'icon' => $category['icon'],
                        'is_active' => $category['is_active'],
                        'parent_id' => null,
                    ]
                );
                $categoryMap[$category['slug']] = $created->id;
            }
        }
        
        // Second pass: Create child categories
        foreach ($categories as $category) {
            if ($category['parent_slug'] !== null && isset($categoryMap[$category['parent_slug']])) {
                Category::updateOrCreate(
                    ['slug' => $category['slug']],
                    [
                        'name' => $category['name'],
                        'icon' => $category['icon'],
                        'is_active' => $category['is_active'],
                        'parent_id' => $categoryMap[$category['parent_slug']],
                    ]
                );
            }
        }
        
        $activeCount = Category::where('is_active', true)->count();
        $this->command->info('  ✓ Categories seeded: ' . $activeCount);
    }
}
