<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDeviceBrandService;
use Illuminate\Http\Request;

class AdminDeviceBrandController extends Controller
{
    public function __construct(protected AdminDeviceBrandService $brandService) {}

    /**
     * لیست برندهای دستگاه
     */
    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search'),
            'type' => $request->get('type'), // mobile, laptop, tablet, accessory
            'is_active' => $request->get('is_active'),
        ];

        $data = $this->brandService->getBrands($filters, (int) $request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * ایجاد برند دستگاه جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:device_brands,slug',
            'type' => 'required|in:mobile,laptop,tablet,accessory', // ✅ فیلد حیاتی برای سلکتور
            'is_active' => 'sometimes|boolean',
        ]);

        $brand = $this->brandService->createBrand($validated);

        return response()->json([
            'success' => true,
            'message' => 'برند دستگاه با موفقیت ایجاد شد',
            'data' => ['id' => $brand->id, 'name' => $brand->name]
        ], 201);
    }

    /**
     * به‌روزرسانی برند دستگاه
     */
    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:device_brands,slug,' . $id,
            'type' => 'sometimes|in:mobile,laptop,tablet,accessory',
            'is_active' => 'sometimes|boolean',
        ]);

        $brand = $this->brandService->updateBrand($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'برند دستگاه با موفقیت به‌روزرسانی شد',
            'data' => ['id' => $brand->id, 'name' => $brand->name]
        ]);
    }

    /**
     * حذف برند دستگاه
     */
    public function destroy(int $id)
    {
        $this->brandService->deleteBrand($id);

        return response()->json([
            'success' => true,
            'message' => 'برند دستگاه با موفقیت حذف شد',
        ]);
    }
}