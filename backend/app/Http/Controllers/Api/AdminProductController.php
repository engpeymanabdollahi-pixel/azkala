<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminProductService;
use App\Services\ProductRelationshipService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminProductController extends Controller
{
    public function __construct(
        protected AdminProductService $productService,
        protected ProductRelationshipService $productRelationshipService
    ) {}

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

    /**
     * ✅ Product Relationship Phase 2: مدیریت رابطه‌ی «مکمل» توسط ادمین —
     * بدون محدودیت مالکیت (Hybrid ownership: ادمین می‌تواند بین هر دو
     * محصول فعال رابطه بسازد، برخلاف فروشنده که به محصولات خودش محدود
     * است). $sellerId=null دقیقاً همین معنا را به ProductRelationshipService
     * می‌رساند.
     */
    public function relationships(int $product)
    {
        try {
            $items = $this->productRelationshipService->listForProduct($product, null);

            return response()->json([
                'success' => true,
                'data' => $items->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'sort_order' => $r->sort_order,
                        'target_product' => $r->targetProduct ? [
                            'id' => $r->targetProduct->id,
                            'name' => $r->targetProduct->name,
                            'slug' => $r->targetProduct->slug,
                            'main_image' => $r->targetProduct->main_image,
                        ] : null,
                    ];
                }),
            ]);
        } catch (NotFoundHttpException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function storeRelationship(Request $request, int $product)
    {
        $validated = $request->validate([
            'target_product_id' => 'required|integer',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        try {
            $relationship = $this->productRelationshipService->create(
                $product,
                (int) $validated['target_product_id'],
                null,
                (int) ($validated['sort_order'] ?? 0)
            );

            return response()->json([
                'success' => true,
                'message' => 'محصول مکمل با موفقیت اضافه شد.',
                'data' => ['id' => $relationship->id],
            ], 201);
        } catch (NotFoundHttpException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        } catch (ValidationException $e) {
            throw $e;
        }
    }

    public function destroyRelationship(int $product, int $relationship)
    {
        try {
            $this->productRelationshipService->delete($relationship, $product, null);

            return response()->json(['success' => true, 'message' => 'حذف شد.']);
        } catch (NotFoundHttpException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }
}
