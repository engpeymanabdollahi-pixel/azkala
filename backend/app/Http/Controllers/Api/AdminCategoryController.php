<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminCategoryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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

            // ✅ Device-First Architecture فاز ۱I: چندبه‌چند با DeviceFamily.
            // ✅ Marketplace Unification فاز B3: صرفاً وجود ردیف کافی نیست —
            // خانواده‌ی غیرفعال نباید قابل‌اتصال به دسته باشد (طبق الزام
            // صریح این فاز).
            'device_family_ids' => 'nullable|array',
            'device_family_ids.*' => ['integer', Rule::exists('device_families', 'id')->where('is_active', true)],
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

            // ✅ فاز ۱I: عدم ارسال یعنی «تغییری نده» (نه پاک‌کردن)، چون این
            // یک فیلد جدید و اختیاری است و اکثر فراخوان‌های موجودِ ویرایش
            // دسته اصلاً از آن خبر ندارند — دقیقاً همان قاعده‌ای که برای
            // variants در فرم محصول فروشنده استفاده شد.
            'device_family_ids' => 'sometimes|array',
            'device_family_ids.*' => ['integer', Rule::exists('device_families', 'id')->where('is_active', true)],
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
    /**
     * حذف دسته‌بندی. اگر زیرمجموعه یا محصول داشته باشد ۴۰۹ برمی‌گردد؛ همان قاعده‌ی
     * bulkAction('delete')، ولی با پیامی که می‌گوید چرا انجام نشد.
     */
    public function destroy($id)
    {
        try {
            $this->categoryService->deleteCategory((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'دسته‌بندی حذف شد',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'دسته‌بندی یافت نشد',
            ], 404);
        } catch (\Exception $e) {
            $status = $e->getCode() === 409 ? 409 : 500;

            return response()->json([
                'success' => false,
                'message' => $status === 409 ? $e->getMessage() : 'خطا در حذف دسته‌بندی',
            ], $status);
        }
    }

    /**
     * مرتب‌سازی مجدد. بدنه‌ی درخواست همان شکلی است که فرانت‌اند می‌فرستد:
     * { items: [{ id, sort_order, parent_id? }] }
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|exists:categories,id',
            'items.*.sort_order' => 'required|integer|min:0',
            'items.*.parent_id' => 'nullable|integer|exists:categories,id',
        ]);

        try {
            $count = $this->categoryService->reorderCategories($validated['items']);

            return response()->json([
                'success' => true,
                'message' => "ترتیب {$count} دسته‌بندی بروزرسانی شد",
            ]);
        } catch (\Exception $e) {
            $status = $e->getCode() === 400 ? 400 : 500;

            return response()->json([
                'success' => false,
                'message' => $status === 400 ? $e->getMessage() : 'خطا در مرتب‌سازی دسته‌بندی‌ها',
            ], $status);
        }
    }

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
