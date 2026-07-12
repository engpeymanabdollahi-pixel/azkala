<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminProductService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminProductController extends Controller
{
    protected AdminProductService $productService;

    public function __construct(AdminProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * لیست محصولات با فیلترهای پیشرفته
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'search' => $request->get('search'),
                'category_id' => $request->get('category_id'),
                'brand_id' => $request->get('brand_id'),
                'seller_id' => $request->get('seller_id'),
                'status' => $request->get('status'),
                'min_price' => $request->get('min_price'),
                'max_price' => $request->get('max_price'),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
            ];

            $data = $this->productService->getProducts($filters, (int) $request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminProductController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * به‌روزرسانی سریع محصول
     */
    public function quickUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
            'is_special_offer' => 'sometimes|boolean',
        ]);

        try {
            $product = $this->productService->quickUpdate((int) $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'محصول به‌روزرسانی شد',
                'data' => $product,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminProductController@quickUpdate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * عملیات دسته‌جمعی
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:products,id',
            'action' => 'required|in:activate,deactivate,delete,feature,unfeature',
        ]);

        try {
            $result = $this->productService->bulkAction($validated['ids'], $validated['action']);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminProductController@bulkAction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * حذف محصول
     */
    public function destroy($id)
    {
        try {
            $this->productService->deleteProduct((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'محصول حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('AdminProductController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * آمار محصول
     */
    public function stats($id)
    {
        try {
            $data = $this->productService->getProductStats((int) $id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminProductController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}