<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminCategoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCategoryController extends Controller
{
    public function __construct(protected AdminCategoryService $categoryService) {}

    /**
     * لیست دسته‌بندی‌ها
     */
    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search'),
            'type' => $request->get('type'),
            'is_active' => $request->get('is_active'),
            'parent_id' => $request->get('parent_id'),
            'sort_by' => $request->get('sort_by', 'sort_order'),
            'sort_order' => $request->get('sort_order', 'asc'),
        ];

        $data = $this->categoryService->getCategories($filters, (int) $request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * درخت دسته‌بندی‌ها
     */
    public function tree()
    {
        $data = $this->categoryService->getCategoryTree();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * ایجاد دسته‌بندی جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->whereNull('deleted_at')],
            'parent_id' => 'nullable|integer|exists:categories,id',
            'icon' => 'nullable|string|max:100',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:200',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'is_temporary' => 'boolean',
            'campaign_name' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'bg_color' => 'nullable|string|max:20',
            'text_color' => 'nullable|string|max:20',
        ]);

        $category = $this->categoryService->createCategory($validated);

        return response()->json([
            'success' => true,
            'message' => 'دسته‌بندی ایجاد شد',
            'data' => $category,
        ], 201);
    }

    /**
     * نمایش یک دسته‌بندی
     */
    public function show($id)
    {
        $data = $this->categoryService->getCategoryDetails((int) $id);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * به‌روزرسانی دسته‌بندی
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->whereNull('deleted_at')->ignore($id)],
            'parent_id' => 'nullable',
            'icon' => 'nullable|string|max:100',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'sometimes|boolean',
            'meta_title' => 'nullable|string|max:200',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'tags' => 'nullable',
            'is_temporary' => 'sometimes|boolean',
            'campaign_name' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'bg_color' => 'nullable|string|max:20',
            'text_color' => 'nullable|string|max:20',
        ]);

        $category = $this->categoryService->updateCategory((int) $id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'دسته‌بندی به‌روزرسانی شد',
            'data' => $category,
        ]);
    }

    /**
     * عملیات گروهی
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:categories,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        $result = $this->categoryService->bulkAction($validated['ids'], $validated['action']);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }
}