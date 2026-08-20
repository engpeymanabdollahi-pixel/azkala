<?php

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminCategoryRepository
{
    /**
     * Get categories with filters
     */
    public function getCategories(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        // ✅ Marketplace Unification فاز B4: بدون این، badge خانواده در
        // لیست ادمین یک کوئری جدا به‌ازای هر ردیف می‌زد (N+1).
        $query = Category::withCount('products')->with('deviceFamilies:id,name,slug');

        // Search
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // Type filter
        if (! empty($filters['type'])) {
            if ($filters['type'] === 'temporary') {
                $query->where('is_temporary', true);
            } elseif ($filters['type'] === 'permanent') {
                $query->where('is_temporary', false);
            }
        }

        // Active filter
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Parent filter
        if (isset($filters['parent_id'])) {
            if ($filters['parent_id'] === 'root') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $filters['parent_id']);
            }
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'sort_order';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $allowedSorts = ['name', 'sort_order', 'products_count', 'created_at'];

        if (! in_array($sortBy, $allowedSorts)) {
            $sortBy = 'sort_order';
        }

        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get category tree
     */
    public function getCategoryTree(): Collection
    {
        return Category::withCount('products')
            ->with('children:id,name,parent_id,icon,image,is_active,sort_order,is_temporary')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Find category by ID
     */
    public function find(int $id): ?Category
    {
        return Category::find($id);
    }

    /**
     * Find category by ID or fail
     */
    public function findOrFail(int $id): Category
    {
        return Category::findOrFail($id);
    }

    /**
     * Find category with products count
     */
    public function findWithCount(int $id): ?Category
    {
        return Category::withCount('products')->find($id);
    }

    /**
     * Create category
     */
    public function create(array $data): Category
    {
        return Category::create($data);
    }

    /**
     * Update category
     */
    public function update(Category $category, array $data): Category
    {
        $category->update($data);

        return $category;
    }

    /**
     * Check if category can be parent (prevent circular reference)
     */
    public function canBeParent(int $categoryId, ?int $parentId): bool
    {
        if ($parentId === null) {
            return true;
        }

        // Cannot be its own parent
        if ($categoryId === $parentId) {
            return false;
        }

        // Check if parent is a descendant of category (circular reference)
        $currentParentId = $parentId;
        $visited = [$categoryId];

        while ($currentParentId !== null) {
            if (in_array($currentParentId, $visited)) {
                return false; // Circular reference detected
            }
            $visited[] = $currentParentId;
            $parent = Category::find($currentParentId);
            $currentParentId = $parent ? $parent->parent_id : null;
        }

        return true;
    }

    /**
     * Generate unique slug
     */
    public function generateUniqueSlug(string $name): string
    {
        $slug = \Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = $originalSlug.'-'.$counter++;
        }

        return $slug;
    }

    /**
     * Calculate next sort order
     */
    public function calculateNextSortOrder(?int $parentId = null): int
    {
        $maxOrder = Category::where('parent_id', $parentId)->max('sort_order');

        return ($maxOrder ?? 0) + 1;
    }

    /**
     * Get categories statistics
     */
    public function getStats(): array
    {
        return [
            'total' => Category::count(),
            'active' => Category::where('is_active', true)->count(),
            'inactive' => Category::where('is_active', false)->count(),
            'temporary' => Category::where('is_temporary', true)->count(),
            'root' => Category::whereNull('parent_id')->count(),
            'with_products' => Category::has('products')->count(),
        ];
    }

    /**
     * Bulk action on categories
     */
    public function bulkAction(array $ids, string $action): int
    {
        switch ($action) {
            case 'activate':
                Category::whereIn('id', $ids)->update(['is_active' => true]);

                return count($ids);

            case 'deactivate':
                Category::whereIn('id', $ids)->update(['is_active' => false]);

                return count($ids);

            case 'delete':
                // Only categories without children and products
                $deletableIds = Category::whereIn('id', $ids)
                    ->whereDoesntHave('children')
                    ->whereDoesntHave('products')
                    ->pluck('id');
                Category::whereIn('id', $deletableIds)->delete();

                return count($deletableIds);

            default:
                return 0;
        }
    }
}
