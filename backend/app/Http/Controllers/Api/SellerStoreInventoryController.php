<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Store\StoreInventoryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

/**
 * مدیریت موجودی فیزیکی محصولات یک فروشگاه (Nearby Physical Stores — Phase 7).
 *
 * هرگز store_id/product_id ارسالی از فرانت‌اند «معتبر» فرض نمی‌شود — دو
 * لایه‌ی ownership مستقل همیشه در StoreInventoryService enforce می‌شوند
 * (رجوع به کامنت آن کلاس). این کنترلر عمداً هیچ منطق ownership ندارد.
 */
class SellerStoreInventoryController extends Controller
{
    public function __construct(protected StoreInventoryService $inventoryService) {}

    public function index(Request $request, $storeId)
    {
        try {
            $inventory = $this->inventoryService->listForStore((int) $storeId, $request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $inventory,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'فروشگاه یافت نشد یا متعلق به شما نیست.',
            ], 404);
        }
    }

    public function upsert(Request $request, $storeId)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
            'stock' => 'required|integer|min:0',
            'pickup_enabled' => 'sometimes|boolean',
        ]);

        try {
            $inventory = $this->inventoryService->upsert(
                (int) $storeId,
                (int) $validated['product_id'],
                $request->user()->id,
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'موجودی فروشگاه به‌روزرسانی شد',
                'data' => $inventory,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'فروشگاه یا محصول یافت نشد یا متعلق به شما نیست.',
            ], 404);
        }
    }

    public function destroy(Request $request, $storeId, $productId)
    {
        try {
            $this->inventoryService->remove((int) $storeId, (int) $productId, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'محصول از موجودی این فروشگاه حذف شد',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'فروشگاه یافت نشد یا متعلق به شما نیست.',
            ], 404);
        }
    }
}
