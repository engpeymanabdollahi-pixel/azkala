<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseHealthCheckSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder performs integrity checks on the seeded data
     */
    public function run(): void
    {
        $this->command->info("\n🔍 Running Database Health Checks...\n");
        
        $issues = [];
        
        // Check 1: Orphaned Products (products without brand or category)
        $orphanedProducts = DB::table('products')
            ->leftJoin('brands', 'products.brand_id', '=', 'brands.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereNull('brands.id')
            ->orWhereNull('categories.id')
            ->count();
        
        if ($orphanedProducts > 0) {
            $issues[] = "⚠️  Found {$orphanedProducts} products with missing brand or category";
        } else {
            $this->command->info("✓ All products have valid brand and category references");
        }
        
        // Check 2: Orphaned Device-Product Relationships
        $orphanedRelations = DB::table('device_product')
            ->leftJoin('devices', 'device_product.device_id', '=', 'devices.id')
            ->leftJoin('products', 'device_product.product_id', '=', 'products.id')
            ->whereNull('devices.id')
            ->orWhereNull('products.id')
            ->count();
        
        if ($orphanedRelations > 0) {
            $issues[] = "⚠️  Found {$orphanedRelations} orphaned device-product relationships";
        } else {
            $this->command->info("✓ All device-product relationships are valid");
        }
        
        // Check 3: Products with Invalid JSON in technical_specs
        $invalidJson = 0;
        $products = DB::table('products')->get();
        
        foreach ($products as $product) {
            if ($product->technical_specs) {
                $decoded = json_decode($product->technical_specs, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $invalidJson++;
                }
            }
        }
        
        if ($invalidJson > 0) {
            $issues[] = "⚠️  Found {$invalidJson} products with invalid JSON in technical_specs";
        } else {
            $this->command->info("✓ All product technical_specs contain valid JSON");
        }
        
        // Check 4: Duplicate SKUs
        $duplicateSkus = DB::table('products')
            ->select('sku', DB::raw('COUNT(*) as count'))
            ->groupBy('sku')
            ->having('count', '>', 1)
            ->count();
        
        if ($duplicateSkus > 0) {
            $issues[] = "⚠️  Found {$duplicateSkus} duplicate SKUs";
        } else {
            $this->command->info("✓ No duplicate SKUs found");
        }
        
        // Check 5: Products with Zero Stock
        $zeroStock = DB::table('products')
            ->where('stock_quantity', 0)
            ->count();
        
        $this->command->info("ℹ️  Products with zero stock: {$zeroStock}");
        
        // Check 6: Device Compatibility Test Query
        $this->command->info("\n📱 Testing Device-First Query Logic...\n");
        
        // Sample query: Find all cases compatible with iPhone 15 Pro Max
        $iphone15ProMax = DB::table('devices')->where('slug', 'iphone-15-pro-max')->first();
        
        if ($iphone15ProMax) {
            $compatibleProducts = DB::table('products')
                ->join('device_product', 'products.id', '=', 'device_product.product_id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('device_product.device_id', $iphone15ProMax->id)
                ->whereIn('categories.slug', ['phone-cases', 'screen-protectors'])
                ->count();
            
            $this->command->info("✓ Found {$compatibleProducts} products compatible with iPhone 15 Pro Max");
        } else {
            $this->command->warn("⚠️  iPhone 15 Pro Max device not found in database");
        }
        
        // Final Report
        $this->command->info("\n" . str_repeat('=', 60));
        
        if (empty($issues)) {
            $this->command->info('✅ DATABASE HEALTH CHECK PASSED - All integrity checks successful!');
        } else {
            $this->command->error('❌ DATABASE HEALTH CHECK FAILED - Issues found:');
            foreach ($issues as $issue) {
                $this->command->error($issue);
            }
        }
        
        $this->command->info(str_repeat('=', 60) . "\n");
    }
}
