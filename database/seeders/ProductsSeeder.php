<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Device;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Database\Seeders\Data\MasterProductsCatalog;

class ProductsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🛍️ Seeding Products...');
        
        // Get extended catalog (200+ products)
        $products = MasterProductsCatalog::generateExtendedCatalog(200);
        $createdCount = 0;
        $compatibilityCount = 0;
        
        foreach ($products as $productData) {
            // Find brand by slug
            $brand = Brand::where('slug', $productData['brand_slug'])->first();
            
            if (!$brand) {
                $this->command->warn("  ⚠️ Brand '{$productData['brand_slug']}' not found for product '{$productData['base_name']}'");
                continue;
            }
            
            // Find category by full slug path
            $category = $this->findCategoryBySlug($productData['category_slug']);
            
            if (!$category) {
                $this->command->warn("  ⚠️ Category '{$productData['category_slug']}' not found for product '{$productData['base_name']}'");
                continue;
            }
            
            // Generate unique SKU
            $sku = 'AZ-' . strtoupper(Str::random(3)) . '-' . Str::upper(Str::random(3));
            
            // Create or update product
            $product = Product::updateOrCreate(
                ['sku' => $sku],
                [
                    'name' => $productData['base_name'],
                    'slug' => Str::slug($productData['base_name']),
                    'brand_id' => $brand->id,
                    'category_id' => $category->id,
                    'price' => $productData['price'],
                    'discount_price' => null,
                    'stock_quantity' => $productData['stock_quantity'] ?? 0,
                    'technical_specs' => $productData['technical_specs'],
                    'seo_description' => $productData['seo_description'],
                    'images' => $productData['images'],
                    'is_active' => true,
                    'is_featured' => false,
                ]
            );
            
            $createdCount++;
            
            // Create device compatibility relationships
            if (isset($productData['technical_specs']['compatibility'])) {
                $compatibleDevices = $this->findCompatibleDevices($productData);
                
                foreach ($compatibleDevices as $device) {
                    // Use insertIgnore to avoid duplicate pivot records
                    Device::withoutEvents(function () use ($product, $device) {
                        DB::table('device_product')->insertOrIgnore([
                            'device_id' => $device->id,
                            'product_id' => $product->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    });
                    $compatibilityCount++;
                }
            }
        }
        
        $this->command->info('  ✓ Products seeded: ' . $createdCount);
        $this->command->info('  ✓ Device-Product relationships: ' . $compatibilityCount);
    }
    
    /**
     * Find category by full slug path (e.g., "accessories/phone-cases")
     */
    private function findCategoryBySlug(string $fullSlug): ?Category
    {
        $parts = explode('/', $fullSlug);
        
        if (count($parts) === 1) {
            // Main category
            return Category::where('slug', $parts[0])->whereNull('parent_id')->first();
        }
        
        // Subcategory - find by slug and check parent relationship
        $subcategory = Category::where('slug', end($parts))->first();
        
        if ($subcategory && $subcategory->parent) {
            // Verify parent matches
            if ($subcategory->parent->slug === $parts[0]) {
                return $subcategory;
            }
        }
        
        // Fallback: try to find any matching subcategory
        return Category::where('slug', end($parts))->first();
    }
    
    /**
     * Find devices compatible with this product based on specs
     */
    private function findCompatibleDevices(array $productData): array
    {
        $compatibleDevices = [];
        $specs = $productData['technical_specs'];
        
        // Check for explicit compatibility field
        if (isset($specs['compatibility'])) {
            $compatibilityText = strtolower($specs['compatibility']);
            
            // iPhone compatibility
            if (strpos($compatibilityText, 'iphone') !== false) {
                if (strpos($compatibilityText, '16 pro max') !== false) {
                    $compatibleDevices[] = Device::where('slug', 'iphone-16-pro-max')->first();
                } elseif (strpos($compatibilityText, '16 pro') !== false) {
                    $compatibleDevices[] = Device::where('slug', 'iphone-16-pro')->first();
                } elseif (strpos($compatibilityText, '15 pro max') !== false) {
                    $compatibleDevices[] = Device::where('slug', 'iphone-15-pro-max')->first();
                } elseif (strpos($compatibilityText, '14 pro max') !== false) {
                    $compatibleDevices[] = Device::where('slug', 'iphone-14-pro-max')->first();
                }
                // Add more patterns as needed
            }
            
            // MacBook compatibility
            if (strpos($compatibilityText, 'macbook') !== false) {
                // MacBooks don't have device entries typically, skip for now
            }
        }
        
        // Filter out null values
        return array_filter($compatibleDevices);
    }
}
