<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductImage;

/**
 * 🖼️ برای هر محصولی که تصویر ندارد، یک مجموعه‌ی ۳تایی SVG اختصاصی می‌سازد
 * و در storage/app/public/products ذخیره می‌کند؛ سپس رکوردهای product_images
 * را می‌سازد و main_image را ست می‌کند.
 *
 * ایدم‌پوتنت است: روی اجرای مجدد، فایل‌ها بازنویسی و ردیف‌ها updateOrCreate
 * می‌شوند و main_image فقط در صورت خالی بودن ست می‌شود.
 */
class ProductImageSeeder extends Seeder
{
    /** گرادیان‌های رنگی برای تنوع ظاهری محصولات */
    private array $palette = [
        ['#0d9488', '#134e4a'], // teal
        ['#f97316', '#7c2d12'], // orange
        ['#6366f1', '#1e1b4b'], // indigo
        ['#e11d48', '#4c0519'], // rose
        ['#059669', '#022c22'], // emerald
        ['#0ea5e9', '#082f49'], // sky
        ['#8b5cf6', '#2e1065'], // violet
        ['#f59e0b', '#451a03'], // amber
    ];

    public function run(): void
    {
        $this->command->info('🖼️ در حال ساخت تصاویر محصولات...');

        $dir = storage_path('app/public/products');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $count = 0;

        foreach (Product::with('brand')->get() as $product) {
            $base = '/storage/products/'.$product->slug;
            $palette = $this->palette[$product->id % count($this->palette)];
            $primaryPath = null;

            for ($i = 1; $i <= 3; $i++) {
                $filename = $product->slug.'-'.$i.'.svg';
                $path = $base.'-'.$i.'.svg';

                file_put_contents(
                    $dir.'/'.$filename,
                    $this->buildSvg($product, $palette, $i),
                );

                ProductImage::updateOrCreate(
                    ['product_id' => $product->id, 'sort_order' => $i],
                    ['image_path' => $path, 'is_primary' => $i === 1],
                );

                if ($i === 1) {
                    $primaryPath = $path;
                }
            }

            if (empty($product->main_image)) {
                $product->main_image = $primaryPath;
                $product->gallery = [$base.'-1.svg', $base.'-2.svg', $base.'-3.svg'];
                $product->save();
            }

            $count++;
        }

        $this->command->info("✅ تصاویر برای {$count} محصول ساخته و ثبت شد.");
    }

    /** ساخت SVG پلِیس‌هولدر تمیز با نام و برند محصول */
    private function buildSvg(Product $product, array $palette, int $variant): string
    {
        [$c1, $c2] = $palette;

        $name = mb_strlen($product->name) > 30
            ? mb_substr($product->name, 0, 29).'…'
            : $product->name;

        $brand = $product->brand?->name ?? 'ازکالا';

        $circle1 = $variant === 2 ? 'cx="120" cy="140" r="150"' : 'cx="490" cy="110" r="160"';
        $circle2 = $variant === 3 ? 'cx="490" cy="490" r="140"' : 'cx="90" cy="520" r="120"';

        $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{$c1}"/>
      <stop offset="1" stop-color="{$c2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <circle {$circle1} fill="rgba(255,255,255,0.10)"/>
  <circle {$circle2} fill="rgba(255,255,255,0.07)"/>
  <text x="300" y="245" font-family="Vazirmatn, Tahoma, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">{$escape($name)}</text>
  <text x="300" y="300" font-family="Vazirmatn, Tahoma, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)" text-anchor="middle">{$escape($brand)}</text>
  <rect x="220" y="355" width="160" height="46" rx="23" fill="rgba(255,255,255,0.16)"/>
  <text x="300" y="385" font-family="Vazirmatn, Tahoma, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">ازکالا</text>
</svg>
SVG;
    }
}
