<?php

namespace App\Services\Seller;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceModel;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class BulkProductService
{
    /**
     * Parse and validate Excel file
     * Returns: { valid: [], errors: [] }
     */
    public function validateFile($file, int $sellerId): array
    {
        $rows = Excel::toCollection($file)->first();

        $valid = [];
        $errors = [];

        // Skip header row
        $rows->shift();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +2 because: 1-based + header
            $rowData = $row->toArray();

            $rowErrors = $this->validateRow($rowData, $rowNumber, $sellerId);

            if (empty($rowErrors)) {
                $valid[] = [
                    'row' => $rowNumber,
                    'data' => $this->normalizeRow($rowData),
                ];
            } else {
                $errors[] = [
                    'row' => $rowNumber,
                    'data' => $rowData,
                    'errors' => $rowErrors,
                ];
            }
        }

        return compact('valid', 'errors');
    }

    private function validateRow(array $data, int $rowNumber, int $sellerId): array
    {
        $errors = [];

        // Required fields
        if (empty($data[0])) {
            $errors[] = 'نام محصول الزامی است';
        }
        if (empty($data[1])) {
            $errors[] = 'SKU الزامی است';
        }
        if (empty($data[2])) {
            $errors[] = 'slug دسته‌بندی الزامی است';
        }
        if (empty($data[4])) {
            $errors[] = 'قیمت الزامی است';
        }
        if (! isset($data[6]) || $data[6] === '') {
            $errors[] = 'موجودی الزامی است';
        }

        // SKU uniqueness
        if (! empty($data[1])) {
            $skuExists = Product::where('sku', $data[1])->exists();
            if ($skuExists) {
                $errors[] = "SKU '{$data[1]}' قبلاً استفاده شده";
            }
        }

        // Category exists
        if (! empty($data[2])) {
            $categoryExists = Category::where('slug', $data[2])->exists();
            if (! $categoryExists) {
                $errors[] = "دسته‌بندی با slug '{$data[2]}' یافت نشد";
            }
        }

        // Brand exists (if provided)
        if (! empty($data[3])) {
            $brandExists = Brand::where('slug', $data[3])->exists();
            if (! $brandExists) {
                $errors[] = "برند با slug '{$data[3]}' یافت نشد";
            }
        }

        // Price validation
        if (! empty($data[4]) && ! is_numeric($data[4])) {
            $errors[] = 'قیمت باید عددی باشد';
        }

        // Stock validation
        if (isset($data[6]) && $data[6] !== '' && ! is_numeric($data[6])) {
            $errors[] = 'موجودی باید عددی باشد';
        }

        return $errors;
    }

    private function normalizeRow(array $data): array
    {
        return [
            'name' => trim($data[0] ?? ''),
            'sku' => trim($data[1] ?? ''),
            'category_slug' => trim($data[2] ?? ''),
            'brand_slug' => trim($data[3] ?? ''),
            'price' => (float) ($data[4] ?? 0),
            'compare_price' => ! empty($data[5]) ? (float) $data[5] : null,
            'stock' => (int) ($data[6] ?? 0),
            'short_description' => trim($data[7] ?? ''),
            'description' => trim($data[8] ?? ''),
            'main_image_url' => trim($data[9] ?? ''),
            'specifications_json' => trim($data[10] ?? ''),
            'device_model_slug' => trim($data[11] ?? ''),
        ];
    }

    /**
     * Create products from validated rows
     */
    public function createProducts(array $validRows, int $sellerId): array
    {
        $created = [];
        $failed = [];

        foreach ($validRows as $item) {
            try {
                $data = $item['data'];
                $rowNumber = $item['row'];

                // Resolve IDs from slugs
                $category = Category::where('slug', $data['category_slug'])->first();
                $brand = ! empty($data['brand_slug'])
                    ? Brand::where('slug', $data['brand_slug'])->first()
                    : null;
                $deviceModel = ! empty($data['device_model_slug'])
                    ? DeviceModel::where('slug', $data['device_model_slug'])->first()
                    : null;

                // Generate unique slug
                $baseSlug = Str::slug($data['name']);
                $slug = $baseSlug;
                $count = 1;
                while (Product::where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$count++;
                }

                // Download main image if URL provided
                $mainImage = null;
                if (! empty($data['main_image_url']) && filter_var($data['main_image_url'], FILTER_VALIDATE_URL)) {
                    $mainImage = $this->downloadImage($data['main_image_url'], $sellerId);
                }

                // Parse specifications
                $specifications = null;
                if (! empty($data['specifications_json'])) {
                    $decoded = json_decode($data['specifications_json'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $specifications = $decoded;
                    }
                }

                // Create product
                $product = Product::create([
                    'seller_id' => $sellerId,
                    'category_id' => $category->id,
                    'brand_id' => $brand?->id,
                    'device_model_id' => $deviceModel?->id,
                    'name' => $data['name'],
                    'slug' => $slug,
                    'sku' => $data['sku'],
                    'price' => $data['price'],
                    'compare_price' => $data['compare_price'],
                    'stock' => $data['stock'],
                    'short_description' => $data['short_description'] ?: null,
                    'description' => $data['description'] ?: null,
                    'main_image' => $mainImage,
                    'specifications' => $specifications,
                    'is_active' => true,
                ]);

                $created[] = [
                    'row' => $rowNumber,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                ];

            } catch (\Exception $e) {
                Log::error('Bulk product creation failed', [
                    'row' => $rowNumber,
                    'error' => $e->getMessage(),
                ]);

                $failed[] = [
                    'row' => $rowNumber,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return compact('created', 'failed');
    }

    /**
     * Download image from URL and save to storage
     *
     * ✅ قبلاً این متد بدون هیچ محدودیتی روی هر URL دلخواهی که فروشنده در
     * ستون main_image_url فایل اکسل می‌گذاشت، از سمت سرور Http::get می‌زد
     * (SSRF واقعی): یک فروشنده می‌توانست آدرسی مثل
     * http://169.254.169.254/latest/meta-data/ (متادیتای سرورهای ابری) یا
     * http://127.0.0.1:<port>/... (سرویس‌های داخلی شبکه) بدهد و سرور را
     * مجبور به درخواست به آن‌ها کند. isSafeExternalUrl() قبل از هر درخواست
     * اسکیم/DNS/IP را بررسی و آدرس‌های private/loopback/link-local را رد
     * می‌کند.
     *
     * پسوند فایل هم قبلاً مستقیم از URL خوانده می‌شد (کاربر می‌توانست URLای
     * با پسوند دلخواه مثل .php بدهد)؛ حالا از روی Content-Type واقعی پاسخ
     * تعیین می‌شود و فقط انواع تصویر شناخته‌شده پذیرفته‌اند.
     */
    private function downloadImage(string $url, int $sellerId): ?string
    {
        try {
            if (! $this->isSafeExternalUrl($url)) {
                Log::warning('Bulk image download blocked: unsafe URL', ['url' => $url]);

                return null;
            }

            $response = Http::timeout(10)->get($url);

            if (! $response->successful()) {
                return null;
            }

            $mimeExtensions = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
            ];
            $contentType = strtolower(explode(';', $response->header('Content-Type') ?? '')[0]);

            if (! isset($mimeExtensions[$contentType])) {
                Log::warning('Bulk image download blocked: unsupported content-type', [
                    'url' => $url,
                    'content_type' => $contentType,
                ]);

                return null;
            }

            $filename = 'products/'.uniqid('product_').'.'.$mimeExtensions[$contentType];

            Storage::disk('public')->put($filename, $response->body());

            return $filename;
        } catch (\Exception $e) {
            Log::warning('Image download failed: '.$e->getMessage());

            return null;
        }
    }

    /**
     * محافظ SSRF: فقط http/https با میزبانی که به IP عمومی (نه
     * private/loopback/link-local/reserved) resolve می‌شود مجاز است.
     */
    private function isSafeExternalUrl(string $url): bool
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = $parts['host'] ?? null;

        if (! $host || ! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);

        if (empty($ips)) {
            return false;
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return false;
            }
        }

        return true;
    }
}
