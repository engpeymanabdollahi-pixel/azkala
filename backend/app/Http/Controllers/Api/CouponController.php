<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Services\CouponService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    // ✅ استفاده از Constructor Property Promotion
    public function __construct(protected CouponService $couponService) {}

    public function validateCoupon(Request $request)
    {
        $result = $this->couponService->validateCoupon($request->input('code', ''), Auth::id());

        // استخراج status برای پاسخ HTTP و حذف آن از بدنه JSON
        $status = $result['status'] ?? 200;
        unset($result['status']);

        return response()->json($result, $status);
    }

    public function myCoupons()
    {
        return response()->json($this->couponService->getMyCoupons());
    }

    public function index(Request $request)
    {
        // ✅ قبلاً هیچ فیلتری پاس داده نمی‌شد — با اضافه‌شدن صفحه‌بندی واقعی
        // در فرانت‌اند، جستجو/فیلتر سمت کلاینت فقط روی همان یک صفحهٔ
        // بارگذاری‌شده اعمال می‌شد، نه کل کدهای تخفیف.
        $filters = [
            'search' => $request->get('search'),
            'is_active' => $request->get('is_active'),
            'type' => $request->get('type'),
        ];

        $coupons = $this->couponService->getAllCoupons($filters, (int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'coupons' => $coupons->items(),
                'pagination' => [
                    'current_page' => $coupons->currentPage(),
                    'last_page' => $coupons->lastPage(),
                    'per_page' => $coupons->perPage(),
                    'total' => $coupons->total(),
                ],
                // ✅ آمار واقعی روی کل دیتابیس، نه فقط صفحهٔ فعلی.
                'stats' => $this->couponService->getStats(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $coupon = $this->couponService->createCoupon($validated, Auth::id());

            return response()->json(['success' => true, 'message' => 'ایجاد شد', 'data' => $coupon], 201);
        } catch (ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('Coupon store error: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'خطا در ایجاد کوپن'], 500);
        }
    }

    public function show($id)
    {
        $coupon = Coupon::findOrFail($id);

        return response()->json(['success' => true, 'data' => $coupon]);
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:coupons,code,'.$id,
            'type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $updated = $this->couponService->updateCoupon($coupon, $validated);

            return response()->json(['success' => true, 'message' => 'به‌روزرسانی شد', 'data' => $updated]);
        } catch (ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا در به‌روزرسانی'], 500);
        }
    }

    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);
        try {
            $this->couponService->deleteCoupon($coupon);

            return response()->json(['success' => true, 'message' => 'حذف شد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا در حذف'], 500);
        }
    }
}
