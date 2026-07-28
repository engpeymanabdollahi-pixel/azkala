<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBrandService;
use Illuminate\Http\Request;

class AdminBrandController extends Controller
{
    public function __construct(protected AdminBrandService $brandService) {}

    /**
     * لیست برندها با فیلتر
     */
    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search'),
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : null,
            'is_featured' => $request->filled('is_featured') ? (bool) $request->is_featured : null,
            'verified' => $request->filled('verified') ? (bool) $request->verified : null,
            'country' => $request->get('country'),
            'sort_by' => $request->get('sort_by', 'sort_order'),
            'sort_order' => $request->get('sort_order', 'asc'),
        ];

        $data = $this->brandService->getBrands($filters, (int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * نمایش جزئیات یک برند
     */
    public function show(int $id)
    {
        $data = $this->brandService->getBrandDetails($id);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * ایجاد برند جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
            'slug' => 'nullable|string|max:255|unique:brands,slug',
            'logo' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:255',
            'founded_year' => 'nullable|integer|min:1800|max:' . date('Y'),
            'is_featured' => 'sometimes|boolean',
            'meta_title' => 'nullable|string|max:200',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'social_media' => 'nullable',
            'gallery' => 'nullable',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer',
        ]);

        $brand = $this->brandService->createBrand($validated);

        return response()->json([
            'success' => true,
            'message' => 'برند ایجاد شد',
            'data' => $brand,
        ], 201);
    }

    /**
     * به‌روزرسانی برند
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:brands,slug,' . $id,
            'logo' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:255',
            'founded_year' => 'nullable|integer',
            'is_featured' => 'sometimes|boolean',
            'verified_at' => 'nullable|date',
            'verification_badge' => 'nullable|in:none,gold,platinum,diamond',
            'meta_title' => 'nullable|string|max:200',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'social_media' => 'nullable',
            'gallery' => 'nullable',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer',
        ]);

        $brand = $this->brandService->updateBrand((int) $id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'برند به‌روزرسانی شد',
            'data' => $brand,
        ]);
    }

        /**
     * حذف برند
     */
    public function destroy($id)
    {
        // ✅ اصلاح حیاتی: اگر لاراول به دلیل Route Model Binding آبجکت فرستاد، ID آن را استخراج کن
        $brandId = $id instanceof \App\Models\Brand ? $id->id : (int) $id;

        $this->brandService->deleteBrand($brandId);

        return response()->json([
            'success' => true,
            'message' => 'برند حذف شد',
        ]);
    }

    /**
     * تأیید برند
     */
    public function verify($id)
    {
        $this->brandService->verifyBrand((int) $id);

        return response()->json([
            'success' => true,
            'message' => 'برند تأیید شد',
        ]);
    }

    /**
     * لغو تأیید برند
     */
    public function unverify($id)
    {
        $this->brandService->unverifyBrand((int) $id);

        return response()->json([
            'success' => true,
            'message' => 'تأیید برند لغو شد',
        ]);
    }

    /**
     * عملیات گروهی
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:brands,id',
            'action' => 'required|in:activate,deactivate,feature,unfeature,delete',
        ]);

        $result = $this->brandService->bulkAction($validated['ids'], $validated['action']);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }
}