<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminProductService;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function __construct(protected AdminProductService $productService) {}

    /**
     * لیست محصولات با فیلترهای پیشرفته
     */
    public function index(Request $request)
    {
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

        $product = $this->productService->quickUpdate((int) $id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'محصول به‌روزرسانی شد',
            'data' => $product,
        ]);
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

        $result = $this->productService->bulkAction($validated['ids'], $validated['action']);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * حذف محصول
     */
    public function destroy($id)
    {
        $this->productService->deleteProduct((int) $id);

        return response()->json([
            'success' => true,
            'message' => 'محصول حذف شد',
        ]);
    }

    /**
     * آمار محصول
     */
    public function stats($id)
    {
        $data = $this->productService->getProductStats((int) $id);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}