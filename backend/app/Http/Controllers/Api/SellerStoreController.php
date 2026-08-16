<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Store\StoreService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * مدیریت فروشگاه‌های فیزیکی فروشنده (Nearby Physical Stores — Phase 7).
 *
 * ownership همیشه در لایه‌ی Service (StoreService) با یک شرط واحد در همان
 * کوئری enforce می‌شود؛ این کنترلر فقط validate می‌کند و delegate می‌کند —
 * دقیقاً همان الگوی SellerProductController.
 */
class SellerStoreController extends Controller
{
    public function __construct(protected StoreService $storeService) {}

    public function index(Request $request)
    {
        $stores = $this->storeService->listForSeller($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $stores,
        ]);
    }

    public function show(Request $request, $id)
    {
        try {
            $store = $this->storeService->getForSeller((int) $id, $request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $store,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'فروشگاه یافت نشد یا متعلق به شما نیست.',
            ], 404);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:2000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'sometimes|boolean',
        ]);

        $store = $this->storeService->create($request->user()->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'فروشگاه با موفقیت ثبت شد و در انتظار تایید ادمین است.',
            'data' => $store,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:2000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'sometimes|boolean',
        ]);

        try {
            $store = $this->storeService->update((int) $id, $request->user()->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'فروشگاه به‌روزرسانی شد',
                'data' => $store,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'فروشگاه یافت نشد یا متعلق به شما نیست.',
            ], 404);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $this->storeService->delete((int) $id, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'فروشگاه حذف شد',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'فروشگاه یافت نشد یا متعلق به شما نیست.',
            ], 404);
        }
    }

    /**
     * جایگزینی کامل ساعات کاری هفتگی (PUT semantics — رجوع به کامنت
     * StoreService::setHours).
     */
    public function setHours(Request $request, $id)
    {
        $validated = $request->validate([
            'hours' => 'required|array|max:7',
            'hours.*.day_of_week' => 'required|integer|between:0,6',
            'hours.*.opens_at' => 'nullable|date_format:H:i',
            'hours.*.closes_at' => 'nullable|date_format:H:i',
            'hours.*.is_closed' => 'sometimes|boolean',
        ]);

        try {
            $store = $this->storeService->setHours((int) $id, $request->user()->id, $validated['hours']);

            return response()->json([
                'success' => true,
                'message' => 'ساعات کاری به‌روزرسانی شد',
                'data' => $store,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'فروشگاه یافت نشد یا متعلق به شما نیست.',
            ], 404);
        } catch (\Exception $e) {
            Log::error('SellerStoreController@setHours: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در ذخیره‌ی ساعات کاری',
            ], 500);
        }
    }
}
