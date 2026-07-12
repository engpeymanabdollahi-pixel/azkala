<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminReviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminReviewController extends Controller
{
    protected AdminReviewService $reviewService;

    public function __construct(AdminReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    /**
     * لیست نظرات
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'rating' => $request->get('rating'),
                'product_id' => $request->get('product_id'),
                'is_verified' => $request->get('is_verified'),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
            ];

            $data = $this->reviewService->getReviews($filters, (int) $request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReviewController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * تغییر وضعیت نظر
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        try {
            $this->reviewService->updateStatus((int) $id, $validated['status']);

            return response()->json([
                'success' => true,
                'message' => 'وضعیت نظر تغییر کرد',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * پاسخ به نظر
     */
    public function reply(Request $request, $id)
    {
        $validated = $request->validate([
            'reply' => 'required|string|max:1000',
        ]);

        try {
            $adminId = auth()->id();
            $this->reviewService->replyToReview((int) $id, $validated['reply'], $adminId);

            return response()->json([
                'success' => true,
                'message' => 'پاسخ ثبت شد',
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReviewController@reply: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * عملیات گروهی
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:reviews,id',
            'action' => 'required|in:approve,reject,delete',
        ]);

        try {
            $result = $this->reviewService->bulkAction($validated['ids'], $validated['action']);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReviewController@bulkAction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * حذف نظر
     */
    public function destroy($id)
    {
        try {
            $this->reviewService->deleteReview((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'نظر حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReviewController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}