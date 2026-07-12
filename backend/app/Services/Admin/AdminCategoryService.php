<?php

namespace App\Services\Admin;

use App\Models\Category;
use App\Repositories\AdminCategoryRepository;
use Illuminate\Support\Facades\Log;

class AdminCategoryService
{
    protected AdminCategoryRepository $repository;

    public function __construct(AdminCategoryRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get categories list with filters
     */
    public function getCategories(array $filters = [], int $perPage = 50): array
    {
        try {
            $categories = $this->repository->getCategories($filters, $perPage);
            $stats = $this->repository->getStats();

            return [
                'categories' => $categories->map(function ($cat) {
                    return $this->formatCategory($cat);
                }),
                'pagination' => [
                    'current_page' => $categories->currentPage(),
                    'last_page' => $categories->lastPage(),
                    'per_page' => $categories->perPage(),
                    'total' => $categories->total(),
                ],
                'stats' => $stats,
            ];
        } catch (\Exception $e) {
            Log::error('AdminCategoryService@getCategories: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت دسته‌بندی‌ها', 500);
        }
    }

    /**
     * Get category tree
     */
    public function getCategoryTree(): array
    {
        try {
            $categories = $this->repository->getCategoryTree();

            return [
                'tree' => $categories->map(function ($cat) {
                    return $this->formatCategoryTree($cat);
                }),
            ];
        } catch (\Exception $e) {
            Log::error('AdminCategoryService@getCategoryTree: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت درخت دسته‌بندی', 500);
        }
    }

    /**
     * Create new category
     */
    public function createCategory(array $data): Category
    {
        try {
            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = $this->repository->generateUniqueSlug($data['name']);
            }

            // Calculate sort order if not provided
            if (!isset($data['sort_order'])) {
                $parentId = $data['parent_id'] ?? null;
                $data['sort_order'] = $this->repository->calculateNextSortOrder($parentId);
            }

            $category = $this->repository->create($data);

            return $category->loadCount('products');
        } catch (\Exception $e) {
            Log::error('AdminCategoryService@createCategory: ' . $e->getMessage());
            throw new \Exception('خطا در ایجاد دسته‌بندی: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get category details
     */
    public function getCategoryDetails(int $id): array
    {
        try {
            $category = $this->repository->findWithCount($id);

            if (!$category) {
                throw new \Exception('دسته‌بندی یافت نشد', 404);
            }

            return $this->formatCategory($category, true);
        } catch (\Exception $e) {
            Log::error('AdminCategoryService@getCategoryDetails: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update category
     */
    public function updateCategory(int $id, array $data): Category
    {
        try {
            $category = $this->repository->findOrFail($id);

            // Check circular reference
            if (isset($data['parent_id']) && $data['parent_id'] != null) {
                if (!$this->repository->canBeParent($id, $data['parent_id'])) {
                    throw new \Exception('دسته نمی‌تواند والد خودش باشد', 400);
                }
            }

            // Process tags field
            if (isset($data['tags']) && is_string($data['tags'])) {
                $data['tags'] = json_decode($data['tags'], true) ?? [];
            }

            // Handle empty parent_id
            if (isset($data['parent_id']) && $data['parent_id'] === '') {
                $data['parent_id'] = null;
            }

            // Convert booleans
            if (isset($data['is_active'])) {
                $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
            }
            if (isset($data['is_temporary'])) {
                $data['is_temporary'] = filter_var($data['is_temporary'], FILTER_VALIDATE_BOOLEAN);
            }

            // Remove empty fields
            foreach ($data as $key => $value) {
                if ($value === '' || $value === null) {
                    if (!in_array($key, ['parent_id', 'description', 'image', 'meta_title',
                        'meta_description', 'meta_keywords', 'campaign_name', 'start_date',
                        'end_date', 'bg_color', 'text_color', 'tags'])) {
                        unset($data[$key]);
                    }
                }
            }

            $category = $this->repository->update($category, $data);

            return $category->loadCount('products');
        } catch (\Exception $e) {
            Log::error('AdminCategoryService@updateCategory: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Bulk action on categories
     */
    public function bulkAction(array $ids, string $action): array
    {
        try {
            $count = $this->repository->bulkAction($ids, $action);

            $messages = [
                'activate' => "{$count} دسته فعال شد",
                'deactivate' => "{$count} دسته غیرفعال شد",
                'delete' => "{$count} دسته حذف شد",
            ];

            return [
                'count' => $count,
                'message' => $messages[$action] ?? 'عملیات انجام شد',
            ];
        } catch (\Exception $e) {
            Log::error('AdminCategoryService@bulkAction: ' . $e->getMessage());
            throw new \Exception('خطا در عملیات گروهی', 500);
        }
    }

    /**
     * Format category data
     */
    protected function formatCategory(Category $category, bool $detailed = false): array
    {
        $data = [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'parent_id' => $category->parent_id,
            'icon' => $category->icon,
            'image' => $category->image,
            'description' => $category->description,
            'sort_order' => $category->sort_order,
            'is_active' => (bool) $category->is_active,
            'products_count' => $category->products_count ?? 0,
            'is_temporary' => (bool) ($category->is_temporary ?? false),
            'campaign_name' => $category->campaign_name,
            'start_date' => $category->start_date?->format('Y-m-d'),
            'end_date' => $category->end_date?->format('Y-m-d'),
            'bg_color' => $category->bg_color,
            'text_color' => $category->text_color,
            'is_expired' => $category->isExpired(),
            'is_campaign_active' => $category->isCampaignActive(),
            'created_at' => $category->created_at?->format('Y-m-d H:i'),
        ];

        if ($detailed) {
            $data['meta_title'] = $category->meta_title;
            $data['meta_description'] = $category->meta_description;
            $data['meta_keywords'] = $category->meta_keywords;
            $data['tags'] = $category->tags ?? [];
            $data['parent'] = $category->parent ? [
                'id' => $category->parent->id,
                'name' => $category->parent->name,
            ] : null;
        }

        return $data;
    }

    /**
     * Format category tree
     */
    protected function formatCategoryTree(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'icon' => $category->icon,
            'image' => $category->image,
            'is_active' => (bool) $category->is_active,
            'is_temporary' => (bool) ($category->is_temporary ?? false),
            'sort_order' => $category->sort_order,
            'products_count' => $category->products_count ?? 0,
            'children' => $category->children->map(function ($child) {
                return $this->formatCategoryTree($child);
            })->values(),
        ];
    }
}