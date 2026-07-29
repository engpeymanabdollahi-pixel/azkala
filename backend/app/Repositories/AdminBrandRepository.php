<?php

namespace App\Repositories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminBrandRepository
{
    /**
     * Get brands with filters
     */
    public function getBrands(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Brand::query();

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('slug', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  ->orWhere('country', 'LIKE', "%{$search}%");
            });
        }

        // Status filter
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Featured filter
        if (isset($filters['is_featured'])) {
            $query->where('is_featured', $filters['is_featured']);
        }

        // Verified filter
        if (isset($filters['verified'])) {
            if ($filters['verified']) {
                $query->whereNotNull('verified_at');
            } else {
                $query->whereNull('verified_at');
            }
        }

        // Country filter
        if (!empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'sort_order';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $allowedSorts = ['name', 'sort_order', 'products_count', 'models_count', 'rating', 'created_at'];
        
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'sort_order';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Find brand by ID
     */
    public function find(int $id): ?Brand
    {
        return Brand::find($id);
    }

    /**
     * Find brand by ID or fail
     */
    public function findOrFail(int $id): Brand
    {
        return Brand::findOrFail($id);
    }

    /**
     * Create brand
     */
    public function create(array $data): Brand
    {
        return Brand::create($data);
    }

    /**
     * Update brand
     */
    public function update(Brand $brand, array $data): Brand
    {
        $brand->update($data);
        return $brand;
    }

    /**
     * Delete brand
     */
    public function delete(Brand $brand): bool
    {
        return $brand->delete();
    }

    /**
     * Check if brand can be deleted
     */
    public function canDelete(Brand $brand): array
    {
        if ($brand->products_count > 0) {
            return [
                'can_delete' => false,
                'reason' => 'این برند دارای محصول است و قابل حذف نیست',
            ];
        }

        if ($brand->models_count > 0) {
            return [
                'can_delete' => false,
                'reason' => 'این برند دارای مدل دستگاه است و قابل حذف نیست',
            ];
        }

        return ['can_delete' => true];
    }

               /**
     * Get brand with series and models
     */
    public function getBrandWithDetails(int $id): array
    {
        $brand = $this->findOrFail($id);

        // ✅ اصلاح حیاتی: نام جدول این رابطه phone_series است (بر اساس مدل PhoneSeries)
        $series = $brand->phoneSeries()
            ->select('phone_series.id', 'phone_series.name', 'phone_series.slug', 'phone_series.image', 'phone_series.models_count')
            ->orderBy('phone_series.name')
            ->get();

        // ✅ اصلاح حیاتی: نام جدول نهایی این رابطه hasManyThrough، device_models است
        $models = $brand->deviceModels()
            ->select('device_models.id', 'device_models.name', 'device_models.slug', 'device_models.image', 'device_models.series_id', 'device_models.release_year')
            ->orderBy('device_models.name')
            ->take(50)
            ->get();

        return [
            'brand' => $brand,
            'series' => $series,
            'models' => $models,
        ];
    }

    /**
     * Get brands statistics
     */
    public function getStats(): array
    {
        return [
            'total' => Brand::count(),
            'active' => Brand::where('is_active', true)->count(),
            'inactive' => Brand::where('is_active', false)->count(),
            'featured' => Brand::where('is_featured', true)->count(),
            'verified' => Brand::whereNotNull('verified_at')->count(),
            'with_products' => Brand::where('products_count', '>', 0)->count(),
        ];
    }

        /**
     * Get unique countries
     */
    public function getCountries(): \Illuminate\Support\Collection
    {
        return Brand::whereNotNull('country')
            ->distinct()
            ->pluck('country')
            ->sort()
            ->values();
    }

    /**
     * Generate unique slug
     */
    public function generateUniqueSlug(string $name): string
    {
        $slug = \Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;
        
        while (Brand::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        
        return $slug;
    }

    /**
     * Verify brand
     */
    public function verify(Brand $brand): Brand
    {
        $brand->update([
            'verified_at' => now(),
            'verification_badge' => $brand->verification_badge === 'none' ? 'gold' : $brand->verification_badge,
        ]);
        
        return $brand;
    }

    /**
     * Unverify brand
     */
    public function unverify(Brand $brand): Brand
    {
        $brand->update([
            'verified_at' => null,
            'verification_badge' => 'none',
        ]);
        
        return $brand;
    }

    /**
     * Bulk action on brands
     */
    public function bulkAction(array $ids, string $action): int
    {
        switch ($action) {
            case 'activate':
                Brand::whereIn('id', $ids)->update(['is_active' => true]);
                return count($ids);
                
            case 'deactivate':
                Brand::whereIn('id', $ids)->update(['is_active' => false]);
                return count($ids);
                
            case 'feature':
                Brand::whereIn('id', $ids)->update(['is_featured' => true]);
                return count($ids);
                
            case 'unfeature':
                Brand::whereIn('id', $ids)->update(['is_featured' => false]);
                return count($ids);
                
            case 'delete':
                $deletableIds = Brand::whereIn('id', $ids)
                    ->where('products_count', 0)
                    ->where('models_count', 0)
                    ->pluck('id');
                Brand::whereIn('id', $deletableIds)->delete();
                return count($deletableIds);
                
            default:
                return 0;
        }
    }
}