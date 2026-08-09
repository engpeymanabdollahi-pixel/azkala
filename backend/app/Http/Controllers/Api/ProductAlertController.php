<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alerts\CreateAlertRequest;
use App\Models\Product;
use App\Models\ProductAlert;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductAlertController extends Controller
{
    public function __construct(
        private AlertService $alertService
    ) {}

    /**
     * List user's alerts (paginated)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $alerts = $request->user()->alerts()
                ->with(['product:id,name,slug,main_image,price,discount_price,stock'])
                ->latest()
                ->paginate($request->input('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $alerts,
            ]);
        } catch (\Exception $e) {
            Log::error('ProductAlertController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت هشدارها',
            ], 500);
        }
    }

    /**
     * Create a new alert
     */
    public function store(CreateAlertRequest $request): JsonResponse
    {
        try {
            $alert = $this->alertService->createAlert(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'هشدار با موفقیت ثبت شد',
                'data' => $alert->load('product:id,name,slug,main_image,price,discount_price,stock'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('ProductAlertController@store: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Soft delete alert
     */
    public function destroy(Request $request, ProductAlert $alert): JsonResponse
    {
        try {
            // فقط کاربر مالک می‌تواند حذف کند
            if ($alert->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'دسترسی غیرمجاز',
                ], 403);
            }

            $alert->delete();

            return response()->json([
                'success' => true,
                'message' => 'هشدار حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('ProductAlertController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف هشدار',
            ], 500);
        }
    }

    /**
     * Toggle alert active state
     */
    public function toggle(Request $request, ProductAlert $alert): JsonResponse
    {
        try {
            if ($alert->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'دسترسی غیرمجاز',
                ], 403);
            }

            $alert->is_active ? $alert->deactivate() : $alert->activate();

            return response()->json([
                'success' => true,
                'message' => $alert->is_active ? 'هشدار فعال شد' : 'هشدار غیرفعال شد',
                'data' => $alert,
            ]);
        } catch (\Exception $e) {
            Log::error('ProductAlertController@toggle: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * Check alert status for a product
     */
    public function status(Request $request, Product $product): JsonResponse
    {
        try {
            $alerts = $request->user()->alerts()
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'has_alert' => $alerts->isNotEmpty(),
                    'alerts' => $alerts,
                    'restock_alert' => $alerts->contains('type', ProductAlert::TYPE_RESTOCK),
                    'price_drop_alert' => $alerts->contains('type', ProductAlert::TYPE_PRICE_DROP),
                    'target_price_alert' => $alerts->contains('type', ProductAlert::TYPE_TARGET_PRICE),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductAlertController@status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }
}