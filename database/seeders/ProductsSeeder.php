<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Device;
use Database\Data\MasterProductsCatalog;

class ProductsSeeder extends Seeder
{
    /**
     * اجرای سکدر محصولات با الگوی Upsert و ایجاد روابط
     * 
     * @return void
     */
    public function run(): void
    {
        $this->command->info('🛍️ در حال وارد کردن محصولات از کاتالوگ...');

        $products = MasterProductsCatalog::getProducts();
        $productsCount = 0;
        $relationsCount = 0;

        foreach ($products as $productData) {
            // پیدا کردن برند
            $brand = Brand::where('slug', $productData['brand_slug'])->first();
            
            if (!$brand) {
                $this->command->warn("⚠️ برند '{$productData['brand_slug']}' برای محصول '{$productData['base_name']}' یافت نشد. رد شد.");
                continue;
            }

            // پیدا کردن دسته‌بندی
            $category = Category::where('slug', $productData['category_slug'])->first();
            
            if (!$category) {
                $this->command->warn("⚠️ دسته‌بندی '{$productData['category_slug']}' برای محصول '{$productData['base_name']}' یافت نشد. رد شد.");
                continue;
            }

            // تولید اسلاگ یکتا
            $slug = $this->generateSlug($productData['base_name'], $brand->slug);

            // آماده‌سازی داده‌های محصول
            $productFields = [
                'name' => $productData['base_name'],
                'slug' => $slug,
                'brand_id' => $brand->id,
                'price' => $productData['price'] ?? 0,
                'compare_price' => $productData['compare_price'] ?? null,
                'cost' => $productData['cost'] ?? null,
                'stock' => $productData['stock'] ?? 0,
                'sku' => strtoupper(substr($brand->slug, 0, 3)) . '-' . uniqid(),
                'barcode' => null,
                'weight' => $productData['technical_specs']['weight'] ?? null,
                'dimensions' => $productData['technical_specs']['dimensions'] ?? null,
                'short_description' => $this->extractShortDescription($productData['seo_description']),
                'description' => $productData['seo_description'],
                'meta_title' => $productData['base_name'] . ' | خرید با بهترین قیمت',
                'meta_description' => substr($productData['seo_description'], 0, 160),
                'meta_keywords' => $this->extractKeywords($productData['base_name'], $brand->name),
                'attributes' => json_encode($productData['technical_specs']),
                'images' => json_encode($productData['images']),
                'is_active' => true,
                'is_featured' => $brand->is_featured ?? false,
                'published_at' => now(),
            ];

            // ایجاد یا آپدیت محصول
            $product = Product::updateOrCreate(
                ['slug' => $slug],
                $productFields
            );

            // اتصال به دسته‌بندی (رابطه many-to-many)
            if (!$product->categories()->where('category_id', $category->id)->exists()) {
                $product->categories()->attach($category->id);
                $relationsCount++;
            }

            // پیدا کردن دستگاه‌های compatible و ایجاد رابطه
            $compatibleDevices = $this->findCompatibleDevices($productData, $category->slug);
            
            foreach ($compatibleDevices as $device) {
                if (!$product->devices()->where('device_id', $device->id)->exists()) {
                    $product->devices()->attach($device->id);
                    $relationsCount++;
                }
            }

            $productsCount++;
        }

        $this->command->info("✅ {$productsCount} محصول با موفقیت وارد/آپدیت شدند.");
        $this->command->info("🔗 {$relationsCount} رابطه محصول-دسته‌بندی/دستگاه ایجاد شد.");
    }

    /**
     * تولید اسلاگ یکتا از نام محصول
     * 
     * @param string $name
     * @param string $brandSlug
     * @return string
     */
    private function generateSlug(string $name, string $brandSlug): string
    {
        $slug = \Str::slug($name);
        $baseSlug = $slug;
        $counter = 1;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * استخراج توضیحات کوتاه از توضیحات کامل
     * 
     * @param string $description
     * @return string
     */
    private function extractShortDescription(string $description): string
    {
        return mb_substr($description, 0, 200, 'UTF-8') . '...';
    }

    /**
     * استخراج کلمات کلیدی از نام محصول و برند
     * 
     * @param string $productName
     * @param string $brandName
     * @return string
     */
    private function extractKeywords(string $productName, string $brandName): string
    {
        $words = array_merge(
            explode(' ', $productName),
            explode(' ', $brandName)
        );
        
        $keywords = array_filter(array_unique($words), function($word) {
            return mb_strlen($word, 'UTF-8') > 3;
        });

        return implode(', ', array_slice($keywords, 0, 10));
    }

    /**
     * پیدا کردن دستگاه‌های سازگار با محصول بر اساس نوع محصول
     * 
     * @param array $productData
     * @param string $categorySlug
     * @return array
     */
    private function findCompatibleDevices(array $productData, string $categorySlug): array
    {
        $compatibleDevices = [];

        // اگر محصول مربوط به قاب گوشی است
        if (str_contains($categorySlug, 'cases')) {
            // جستجو در نام محصول برای پیدا کردن مدل گوشی
            $productName = strtolower($productData['base_name']);
            
            // الگوهای جستجو برای مدل‌های مختلف
            $patterns = [
                'iphone-16-pro-max' => ['iphone 16 pro max'],
                'iphone-16-pro' => ['iphone 16 pro'],
                'iphone-15-pro-max' => ['iphone 15 pro max'],
                'iphone-15-pro' => ['iphone 15 pro'],
                'iphone-14-pro-max' => ['iphone 14 pro max'],
                'iphone-14-pro' => ['iphone 14 pro'],
                'iphone-13-pro-max' => ['iphone 13 pro max'],
                'iphone-13' => ['iphone 13'],
                'samsung-galaxy-s24-ultra' => ['s24 ultra', 'galaxy s24 ultra'],
                'samsung-galaxy-s24-plus' => ['s24+', 'galaxy s24 plus'],
                'samsung-galaxy-s24' => ['s24 ', 'galaxy s24 '],
                'samsung-galaxy-s23-ultra' => ['s23 ultra', 'galaxy s23 ultra'],
                'xiaomi-14-ultra' => ['xiaomi 14 ultra'],
                'xiaomi-14-pro' => ['xiaomi 14 pro'],
            ];

            foreach ($patterns as $deviceSlug => $keywords) {
                foreach ($keywords as $keyword) {
                    if (str_contains($productName, $keyword)) {
                        $device = Device::where('slug', $deviceSlug)->first();
                        if ($device && !in_array($device->id, array_column($compatibleDevices, 'id'))) {
                            $compatibleDevices[] = $device;
                        }
                        break;
                    }
                }
            }
        }

        // اگر محصول کابل یا شارژر است، می‌تواند با همه دستگاه‌ها سازگار باشد
        if (str_contains($categorySlug, 'cable') || str_contains($categorySlug, 'charger')) {
            // برای سادگی، فقط چند دستگاه پرطرفدار را اضافه می‌کنیم
            $popularDevices = Device::whereIn('slug', [
                'iphone-15-pro-max',
                'iphone-14-pro-max',
                'samsung-galaxy-s24-ultra',
                'xiaomi-14-ultra',
            ])->get();

            foreach ($popularDevices as $device) {
                if (!in_array($device->id, array_column($compatibleDevices, 'id'))) {
                    $compatibleDevices[] = $device;
                }
            }
        }

        return $compatibleDevices;
    }
}
