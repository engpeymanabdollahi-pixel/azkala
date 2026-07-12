<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\PhoneModel;

class LinkProductsToModels extends Command
{
protected $signature = 'app:link-products {--force : Force re-link all products} {--details : Show detailed matching info}';
protected $description = 'Smart link products to compatible phone models';

    // کلمات کلیدی برای تشخیص نوع محصول
    private $productKeywords = [
        'case' => ['case', 'cover', 'قاب', 'کاور'],
        'glass' => ['glass', 'گلس', 'محافظ صفحه', 'screen protector'],
        'charger' => ['charger', 'شارژر', 'آداپتور', 'adapter'],
        'cable' => ['cable', 'کابل', 'سیم'],
        'powerbank' => ['powerbank', 'power bank', 'پاوربانک', 'شارژ همراه'],
        'headphone' => ['headphone', 'airpods', 'هدفون', 'هندزفری', 'ایرپاد'],
        'holder' => ['holder', 'mount', 'هولدر', 'پایه'],
        'watch' => ['watch', 'ساعت'],
    ];

    // کلمات کلیدی برای تشخیص سازگاری
    private $compatibilityKeywords = [
        'for', 'for ', 'برای', 'مخصوص', 'سازگار با', 'compatible with', 'fits'
    ];

    public function handle()
    {
        $this->info('🔗 شروع اتصال هوشمند محصولات به مدل‌های گوشی...');
        $this->newLine();
        
        // پاک کردن لینک‌های قبلی اگر force فعال است
        if ($this->option('force')) {
            DB::table('product_phone_models')->truncate();
            $this->info('🗑️  همه لینک‌های قبلی پاک شدند.');
        }
        
        $products = Product::with(['category', 'brand'])->get();
        $models = PhoneModel::with(['brand', 'series'])->get();
        
        $linkedCount = 0;
        $matchStats = [];
        
        $bar = $this->output->createProgressBar(count($products));
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');
        $bar->start();
        
        foreach ($products as $product) {
            $bar->setMessage("Processing: {$product->name}");
            
            $matchedModelIds = $this->findCompatibleModels($product, $models);
            
            if (!empty($matchedModelIds) && $this->option('verbose')) {
                $this->newLine();
                $this->line("  📦 <info>{$product->name}</info>");
                $this->line("     ↳ " . count($matchedModelIds) . " مدل سازگار پیدا شد");
            }
            
            foreach ($matchedModelIds as $modelId) {
                $exists = DB::table('product_phone_models')
                    ->where('product_id', $product->id)
                    ->where('phone_model_id', $modelId)
                    ->exists();
                
                if (!$exists) {
                    DB::table('product_phone_models')->insert([
                        'product_id' => $product->id,
                        'phone_model_id' => $modelId,
                    ]);
                    $linkedCount++;
                }
            }
            
            $bar->advance();
        }
        
        $bar->setMessage('Done!');
        $bar->finish();
        $this->newLine(2);
        
        // به‌روزرسانی compatible_products_count
        foreach ($models as $model) {
            $count = DB::table('product_phone_models')
                ->where('phone_model_id', $model->id)
                ->count();
            
            DB::table('phone_models')
                ->where('id', $model->id)
                ->update(['compatible_products_count' => $count]);
        }
        
        $totalLinks = DB::table('product_phone_models')->count();
        
        $this->info("✅ اتصال هوشمند کامل شد!");
        $this->info("🔗 لینک‌های جدید ایجاد شده: {$linkedCount}");
        $this->info("📊 مجموع لینک‌ها در دیتابیس: {$totalLinks}");
        
        // نمایش آمار مدل‌ها
        $this->newLine();
        $this->info('📱 آمار مدل‌ها (Top 20):');
        $modelsWithProducts = DB::table('phone_models')
            ->select('phone_models.name', 'brands.name as brand_name', DB::raw('COUNT(product_phone_models.product_id) as product_count'))
            ->leftJoin('product_phone_models', 'phone_models.id', '=', 'product_phone_models.phone_model_id')
            ->leftJoin('brands', 'phone_models.brand_id', '=', 'brands.id')
            ->groupBy('phone_models.id', 'phone_models.name', 'brands.name')
            ->havingRaw('COUNT(product_phone_models.product_id) > 0')
            ->orderByDesc('product_count')
            ->limit(20)
            ->get();
        
        foreach ($modelsWithProducts as $m) {
            $this->line("  • {$m->brand_name} {$m->name}: <comment>{$m->product_count} محصول</comment>");
        }
        
        // نمایش مدل‌های بدون محصول
        $modelsWithoutProducts = DB::table('phone_models')
            ->select('phone_models.name', 'brands.name as brand_name')
            ->leftJoin('product_phone_models', 'phone_models.id', '=', 'product_phone_models.phone_model_id')
            ->leftJoin('brands', 'phone_models.brand_id', '=', 'brands.id')
            ->groupBy('phone_models.id', 'phone_models.name', 'brands.name')
            ->havingRaw('COUNT(product_phone_models.product_id) = 0')
            ->limit(10)
            ->get();
        
        if ($modelsWithoutProducts->count() > 0) {
            $this->newLine();
            $this->warn('⚠️  مدل‌های بدون محصول (Top 10):');
            foreach ($modelsWithoutProducts as $m) {
                $this->line("  • {$m->brand_name} {$m->name}");
            }
        }
        
        return 0;
    }

    /**
     * پیدا کردن مدل‌های سازگار با یک محصول
     */
    private function findCompatibleModels($product, $models): array
    {
        $productName = strtolower($product->name);
        $productSlug = strtolower($product->slug);
        $productDesc = strtolower($product->description ?? '');
        $matchedModelIds = [];
        
        // تشخیص نوع محصول
        $productType = $this->detectProductType($productName);
        
        foreach ($models as $model) {
            $modelName = strtolower($model->name);
            $modelSlug = strtolower($model->slug);
            $brandName = $model->brand ? strtolower($model->brand->name) : '';
            $seriesName = $model->series ? strtolower($model->series->name) : '';
            
            $score = 0;
            
            // ✅ روش ۱: نام مدل در نام محصول (امتیاز بالا)
            if (str_contains($productName, $modelName)) {
                $score += 100;
            }
            
            // ✅ روش ۲: slug مدل در slug محصول
            if (str_contains($productSlug, $modelSlug)) {
                $score += 80;
            }
            
            // ✅ روش ۳: نام برند + نام سری در نام محصول
            if ($brandName && $seriesName) {
                if (str_contains($productName, $brandName) && str_contains($productName, $seriesName)) {
                    $score += 90;
                }
            }
            
            // ✅ روش ۴: فقط نام سری در نام محصول (با کلمات کلیدی سازگاری)
            if ($seriesName && str_contains($productName, $seriesName)) {
                // بررسی وجود کلمات کلیدی سازگاری
                foreach ($this->compatibilityKeywords as $keyword) {
                    if (str_contains($productName, $keyword)) {
                        $score += 70;
                        break;
                    }
                }
                
                // اگر نوع محصول مشخص است و با دسته‌بندی همخوانی دارد
                if ($productType && $this->isCategoryCompatible($product, $productType)) {
                    $score += 50;
                }
            }
            
            // ✅ روش ۵: تطبیق بر اساس برند (برای محصولات عمومی)
            if ($brandName && str_contains($productName, $brandName)) {
                // فقط اگر محصول عمومی است (مثل شارژر، کابل)
                if (in_array($productType, ['charger', 'cable', 'powerbank', 'headphone'])) {
                    $score += 30;
                }
            }
            
            // ✅ روش ۶: تطبیق fuzzy برای نام‌های مشابه
            if ($score < 50) {
                similar_text($productName, $modelName, $percent);
                if ($percent > 70) {
                    $score += 40;
                }
            }
            
            // اگر امتیاز کافی است، مدل را اضافه کن
            if ($score >= 50) {
                $matchedModelIds[] = $model->id;
            }
        }
        
        return array_unique($matchedModelIds);
    }

    /**
     * تشخیص نوع محصول
     */
    private function detectProductType(string $productName): ?string
    {
        foreach ($this->productKeywords as $type => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($productName, strtolower($keyword))) {
                    return $type;
                }
            }
        }
        return null;
    }

    /**
     * بررسی سازگاری دسته‌بندی با نوع محصول
     */
    private function isCategoryCompatible($product, string $productType): bool
    {
        if (!$product->category) return false;
        
        $categoryName = strtolower($product->category->name);
        
        $categoryMap = [
            'case' => ['قاب', 'case', 'cover'],
            'glass' => ['گلس', 'محافظ', 'glass', 'protector'],
            'charger' => ['شارژر', 'charger'],
            'cable' => ['کابل', 'cable'],
            'powerbank' => ['پاوربانک', 'powerbank'],
            'headphone' => ['هدفون', 'هندزفری', 'headphone'],
            'holder' => ['هولدر', 'holder', 'mount'],
        ];
        
        if (isset($categoryMap[$productType])) {
            foreach ($categoryMap[$productType] as $keyword) {
                if (str_contains($categoryName, $keyword)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}