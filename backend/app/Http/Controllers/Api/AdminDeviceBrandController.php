<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDeviceBrandService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'type' => $request->get('type'), // mobile, laptop, tablet, accessory (deprecated)
            'family_id' => $request->get('family_id'),
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
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('device_brands', 'slug')->whereNull('deleted_at')],
            // ✅ Device-First Architecture فاز ۱D: family_id اکنون منبع
            // حقیقتِ اکوسیستم است. type دیگر اجباری نیست — فقط برای
            // سازگاری موقت با کدهای قدیمی که هنوز می‌خوانندش نگه داشته شده
            // (nullable، نه enum بسته‌ای که هر برند جدید مجبور به عضویت در
            // یکی از چهار مقدار ثابت باشد).
            'type' => 'nullable|in:mobile,laptop,tablet,accessory',
            'family_id' => 'required|exists:device_families,id',
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
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('device_brands', 'slug')->whereNull('deleted_at')->ignore($id)],
            'type' => 'nullable|in:mobile,laptop,tablet,accessory',
            'family_id' => 'sometimes|exists:device_families,id',
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