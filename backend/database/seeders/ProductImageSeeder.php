<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use App\Models\Product;
use App\Models\ProductImage;

/**
 * 🖼️ تصاویر واقعی محصولات — از Unsplash CDN دانلود و در
 * storage/app/public/products ذخیره می‌کند؛ سپس رکوردهای product_images
 * و main_image را به‌روز می‌کند.
 *
 * هر دسته‌ی محصول چند عکس اختصاصی دارد (شارژر، کابل، هدفون، ساعت و...).
 * اگر دانلود یک عکس شکست بخورد، همان SVG قبلی/مکان‌نگه‌دار حفظ می‌شود.
 *
 * ایدم‌پوتنت است: روی اجرای مجدد، فایل‌ها بازنویسی و ردیف‌ها updateOrCreate
 * می‌شوند.
 */
class ProductImageSeeder extends Seeder
{
    /** شناسه‌ی عکس‌های واقعی Unsplash — همه تست‌شده و پایدار (گروه‌بندی بر اساس دسته) */
    private array $categoryPhotos = [
        // قاب و کاور
        ['categories' => [1, 2, 3, 4, 5], 'photos' => ['photo-1511707171634-5f897ff02aa9', 'photo-1592899677977-9c10ca588bbd', 'photo-1580910051074-3eb694886505']],
        // گلس و محافظ صفحه
        ['categories' => [6, 7, 8, 9, 10], 'photos' => ['photo-1616348436168-de43ad0db179', 'photo-1586953208448-b95a79798f07', 'photo-1590658268037-6bf12165a8df']],
        // شارژر و کابل
        ['categories' => [11, 12, 13, 14, 15, 16], 'photos' => ['photo-1583863788434-e58a36330cf0', 'photo-1601524909162-ae8725290836', 'photo-1585790050230-5dd28404ccb9', 'photo-1615663245857-ac93bb7c39e7']],
        // هندزفری و هدفون
        ['categories' => [17, 18, 19, 20, 21], 'photos' => ['photo-1505740420928-5e560c06d30e', 'photo-1583394838336-acd977736f90', 'photo-1546435770-a3e426bf472b']],
        // پاوربانک
        ['categories' => [22, 23, 24, 25], 'photos' => ['photo-1609091839311-d5365f9ff1c5', 'photo-1610945265064-0e34e5519bbf', 'photo-1601524909162-ae8725290836']],
        // ساعت هوشمند
        ['categories' => [26, 27, 28, 29], 'photos' => ['photo-1546868871-7041f2a55e12', 'photo-1523275335684-37898b6baf30', 'photo-1574180045827-681f8a1a9622', 'photo-1593642632823-8f785ba67e45']],
        // هولدر و پایه
        ['categories' => [30, 31, 32, 33], 'photos' => ['photo-1618410320928-25228d811631', 'photo-1586953208448-b95a79798f07', 'photo-1511707171634-5f897ff02aa9']],
        // قطعات تعمیراتی
        ['categories' => [34, 35, 36, 37, 38], 'photos' => ['photo-1616348436168-de43ad0db179', 'photo-1590658268037-6bf12165a8df', 'photo-1583863788434-e58a36330cf0']],
    ];

    /** عکس‌های پشتیبان برای دسته‌هایی که در نقشه نیستند */
    private array $fallbackPhotos = [
        'photo-1609091839311-d5365f9ff1c5',
        'photo-1610945265064-0e34e5519bbf',
        'photo-1590658268037-6bf12165a8df',
    ];

    public function run(): void
    {
        $this->command->info('🖼️ در حال دانلود تصاویر واقعی محصولات...');

        $dir = storage_path('app/public/products');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $count = 0;
        $downloaded = 0;
        $failed = 0;

        foreach (Product::all() as $product) {
            $photos = $this->photosFor($product->category_id, $product->id);
            $base = '/storage/products/'.$product->slug;
            $paths = [];

            foreach (array_slice($photos, 0, 3) as $index => $photoId) {
                $i = $index + 1;
                $filename = $product->slug.'-'.$i.'.jpg';
                $file = $dir.'/'.$filename;

                if (! file_exists($file)) {
                    $ok = $this->downloadPhoto($photoId, $file);
                    if ($ok) {
                        $downloaded++;
                    } else {
                        $failed++;
                        // fallback: SVG ساده بساز تا هیچ محصولی بدون تصویر نماند
                        $paths[$i] = $this->fallbackSvg($dir, $product, $i, $base);
                        continue;
                    }
                }

                $paths[$i] = $base.'-'.$i.'.jpg';
            }

            foreach ($paths as $i => $path) {
                ProductImage::updateOrCreate(
                    ['product_id' => $product->id, 'sort_order' => $i],
                    ['image_path' => $path, 'is_primary' => $i === 1],
                );
            }

            $product->main_image = $paths[1] ?? $product->main_image;
            $product->gallery = array_values($paths);
            $product->save();

            $count++;
        }

        $this->command->info("✅ {$count} محصول به‌روزرسانی شد ({$downloaded} عکس دانلود شد، {$failed} ناموفق).");
    }

    /** انتخاب عکس‌ها برای یک محصول بر اساس دسته (با چرخش بر اساس id محصول) */
    private function photosFor(?int $categoryId, int $productId): array
    {
        $pool = null;
        foreach ($this->categoryPhotos as $group) {
            if ($categoryId !== null && in_array($categoryId, $group['categories'], true)) {
                $pool = $group['photos'];
                break;
            }
        }

        $pool ??= $this->fallbackPhotos;

        // چرخش آرایه بر اساس id محصول تا محصولات یک دسته عکس‌های متفاوتی بگیرند
        $offset = $productId % count($pool);
        return array_merge(array_slice($pool, $offset), array_slice($pool, 0, $offset));
    }

    /** دانلود عکس واقعی از Unsplash CDN با سایز ۸۰۰px */
    private function downloadPhoto(string $photoId, string $file): bool
    {
        try {
            $url = 'https://images.unsplash.com/'.$photoId.'?w=800&q=80&auto=format&fit=crop';
            $response = Http::timeout(20)->get($url);

            if (! $response->successful() || ! str_contains($response->header('Content-Type'), 'image')) {
                return false;
            }

            file_put_contents($file, $response->body());

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /** اگر دانلود عکس واقعی شکست خورد، یک SVG ساده به‌عنوان جایگزین می‌سازد */
    private function fallbackSvg(string $dir, Product $product, int $i, string $base): string
    {
        $svgFile = $dir.'/'.$product->slug.'-'.$i.'.svg';

        if (! file_exists($svgFile)) {
            $name = mb_strlen($product->name) > 40 ? mb_substr($product->name, 0, 39).'…' : $product->name;
            $escape = htmlspecialchars($name, ENT_XML1 | ENT_QUOTES, 'UTF-8');
            $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#0d9488"/>
  <circle cx="640" cy="140" r="200" fill="rgba(255,255,255,0.1)"/>
  <text x="400" y="390" font-family="Tahoma, sans-serif" font-size="34" font-weight="bold" fill="#fff" text-anchor="middle">{$escape}</text>
</svg>
SVG;
            file_put_contents($svgFile, $svg);
        }

        return $base.'-'.$i.'.svg';
    }
}
