<?php

namespace App\Services\Admin;

use App\Models\Brand;
use App\Repositories\AdminBrandRepository;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException; // ✅ این خط را اضافه کنید


class AdminBrandService
{
    protected AdminBrandRepository $repository;

    public function __construct(AdminBrandRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get brands list with filters
     */
    public function getBrands(array $filters = [], int $perPage = 20): array
    {
        try {
            $brands = $this->repository->getBrands($filters, $perPage);
            $stats = $this->repository->getStats();
            $countries = $this->repository->getCountries();

            return [
                'brands' => $brands->map(function ($brand) {
                    return $this->formatBrand($brand);
                }),
                'pagination' => [
                    'current_page' => $brands->currentPage(),
                    'last_page' => $brands->lastPage(),
                    'per_page' => $brands->perPage(),
                    'total' => $brands->total(),
                ],
                'stats' => $stats,
                'countries' => $countries,
            ];
        } catch (\Exception $e) {
            Log::error('AdminBrandService@getBrands: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت برندها', 500);
        }
    }

            /**
     * Get brand details with series and models
     */
    public function getBrandDetails(int $id): array
    {
        // ✅ حذف موقت try-catch برای دیدن خطای واقعی لاراول
        $data = $this->repository->getBrandWithDetails($id);

        return [
            'brand' => $this->formatBrand($data['brand'], true),
            'series' => $data['series'],
            'models' => $data['models'],
        ];
    }

    /**
     * Create new brand
     */
    public function createBrand(array $data): Brand
    {
        try {
            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = $this->repository->generateUniqueSlug($data['name']);
            }

            // Process JSON fields
            foreach (['social_media', 'gallery'] as $field) {
                if (isset($data[$field]) && is_string($data[$field])) {
                    $data[$field] = json_decode($data[$field], true) ?? [];
                }
            }

            // Convert booleans
            if (isset($data['is_active'])) {
                $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
            }
            if (isset($data['is_featured'])) {
                $data['is_featured'] = filter_var($data['is_featured'], FILTER_VALIDATE_BOOLEAN);
            }

            // Remove empty fields
            foreach ($data as $key => $value) {
                if ($value === '' || $value === null) {
                    if (!in_array($key, ['description', 'logo', 'country', 'website',
                        'meta_title', 'meta_description', 'meta_keywords',
                        'social_media', 'gallery', 'primary_color', 'secondary_color',
                        'founded_year'])) {
                        unset($data[$key]);
                    }
                }
            }

            // Set defaults
            $data['verification_badge'] = $data['verification_badge'] ?? 'none';
            $data['products_count'] = $data['products_count'] ?? 0;
            $data['models_count'] = $data['models_count'] ?? 0;
            $data['series_count'] = $data['series_count'] ?? 0;
            $data['rating'] = $data['rating'] ?? 0;
            $data['reviews_count'] = $data['reviews_count'] ?? 0;

            return $this->repository->create($data);
        } catch (\Exception $e) {
            Log::error('AdminBrandService@createBrand: ' . $e->getMessage());
            throw new \Exception('خطا در ایجاد برند: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update brand
     */
    public function updateBrand(int $id, array $data): Brand
    {
        try {
            $brand = $this->repository->findOrFail($id);

            // Process JSON fields
            foreach (['social_media', 'gallery'] as $field) {
                if (isset($data[$field]) && is_string($data[$field])) {
                    $data[$field] = json_decode($data[$field], true) ?? [];
                }
            }

            // Convert booleans
            if (isset($data['is_active'])) {
                $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
            }
            if (isset($data['is_featured'])) {
                $data['is_featured'] = filter_var($data['is_featured'], FILTER_VALIDATE_BOOLEAN);
            }

            return $this->repository->update($brand, $data);
        } catch (\Exception $e) {
            Log::error('AdminBrandService@updateBrand: ' . $e->getMessage());
            throw new \Exception('خطا در به‌روزرسانی برند: ' . $e->getMessage(), 500);
        }
    }

    /**
     * حذف برند
     */
    public function deleteBrand(int $id): bool
    {
        $brand = $this->repository->findOrFail($id);

        $canDelete = $this->repository->canDelete($brand);

        if (!$canDelete['can_delete']) {
            // ✅ پرتاب استثنا استاندارد HTTP برای بازگشت کد 400
            throw new BadRequestHttpException($canDelete['reason']);
        }

        return $this->repository->delete($brand);
    }

    /**
     * Verify brand
     */
    public function verifyBrand(int $id): Brand
    {
        try {
            $brand = $this->repository->findOrFail($id);
            return $this->repository->verify($brand);
        } catch (\Exception $e) {
            Log::error('AdminBrandService@verifyBrand: ' . $e->getMessage());
            throw new \Exception('خطا در تأیید برند', 500);
        }
    }

    /**
     * Unverify brand
     */
    public function unverifyBrand(int $id): Brand
    {
        try {
            $brand = $this->repository->findOrFail($id);
            return $this->repository->unverify($brand);
        } catch (\Exception $e) {
            Log::error('AdminBrandService@unverifyBrand: ' . $e->getMessage());
            throw new \Exception('خطا در لغو تأیید برند', 500);
        }
    }

    /**
     * Bulk action on brands
     */
    public function bulkAction(array $ids, string $action): array
    {
        try {
            $count = $this->repository->bulkAction($ids, $action);

            $messages = [
                'activate' => "{$count} برند فعال شد",
                'deactivate' => "{$count} برند غیرفعال شد",
                'feature' => "{$count} برند ویژه شد",
                'unfeature' => "{$count} برند از ویژه خارج شد",
                'delete' => "{$count} برند حذف شد",
            ];

            return [
                'count' => $count,
                'message' => $messages[$action] ?? 'عملیات انجام شد',
            ];
        } catch (\Exception $e) {
            Log::error('AdminBrandService@bulkAction: ' . $e->getMessage());
            throw new \Exception('خطا در عملیات گروهی', 500);
        }
    }

    /**
     * Format brand data
     */
    protected function formatBrand(Brand $brand, bool $detailed = false): array
    {
        $data = [
            'id' => $brand->id,
            'name' => $brand->name,
            'slug' => $brand->slug,
            'logo' => $brand->logo,
            'description' => $brand->description,
            'is_active' => (bool) $brand->is_active,
            'country' => $brand->country,
            'website' => $brand->website,
            'founded_year' => $brand->founded_year,
            'is_featured' => (bool) ($brand->is_featured ?? false),
            'verified_at' => $brand->verified_at?->format('Y-m-d H:i'),
            'verification_badge' => $brand->verification_badge ?? 'none',
            'primary_color' => $brand->primary_color,
            'secondary_color' => $brand->secondary_color,
            'sort_order' => $brand->sort_order ?? 0,
            'products_count' => $brand->products_count ?? 0,
            'models_count' => $brand->models_count ?? 0,
            'series_count' => $brand->series_count ?? 0,
            'rating' => (float) ($brand->rating ?? 0),
            'reviews_count' => $brand->reviews_count ?? 0,
            'created_at' => $brand->created_at?->format('Y-m-d H:i'),
        ];

        if ($detailed) {
            $data['meta_title'] = $brand->meta_title;
            $data['meta_description'] = $brand->meta_description;
            $data['meta_keywords'] = $brand->meta_keywords;
            $data['social_media'] = $brand->social_media ?? [];
            $data['gallery'] = $brand->gallery ?? [];
        }

        return $data;
    }
}