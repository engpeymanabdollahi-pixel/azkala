<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This is the main entry point that orchestrates all seeders
     * in the correct order with transaction support.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Azkala Master Data Seeding...');
        
        DB::transaction(function () {
            // Step 1: Brands and Categories (foundational data)
            $this->call([
                BrandsAndCategoriesSeeder::class,
            ]);
            
            // Step 2: Devices (depends on brands)
            $this->call([
                DevicesSeeder::class,
            ]);
            
            // Step 3: Products (depends on brands, categories, and devices)
            $this->call([
                ProductsSeeder::class,
            ]);
        });
        
        // Print final statistics report
        $this->printStatisticsReport();
    }
    
    /**
     * Print comprehensive statistics report after seeding
     */
    private function printStatisticsReport(): void
    {
        $this->command->info("\n" . str_repeat('=', 60));
        $this->command->info('📊 AZKALA DATA SEEDING REPORT');
        $this->command->info(str_repeat('=', 60));
        
        // Count brands
        $brandsCount = DB::table('brands')->count();
        $this->command->info("✅ Brands Imported: {$brandsCount}");
        
        // Count active categories
        $categoriesCount = DB::table('categories')->where('is_active', true)->count();
        $this->command->info("✅ Active Categories: {$categoriesCount}");
        
        // Count total products
        $productsCount = DB::table('products')->count();
        $this->command->info("✅ Total Products: {$productsCount}");
        
        // Count devices
        $devicesCount = DB::table('devices')->count();
        $this->command->info("✅ Registered Devices: {$devicesCount}");
        
        // Count product-device relationships
        $compatibilityCount = DB::table('device_product')->count();
        $this->command->info("✅ Device-Product Relationships: {$compatibilityCount}");
        
        $this->command->info(str_repeat('=', 60));
        $this->command->info('✨ Seeding completed successfully!');
        $this->command->info(str_repeat('=', 60) . "\n");
    }
}
