<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminReviewService;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    public function __construct(protected AdminReviewService $reviewService) {}

    /**
     * لیست نظرات با فیلتر
     */
    public function index(Request $request)
    {
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
    }

    /**
     * تغییر وضعیت نظر
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $this->reviewService->updateStatus((int) $id, $validated['status']);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت نظر تغییر کرد',
        ]);
    }

    /**
     * پاسخ به نظر
     */
    public function reply(Request $request, $id)
    {
        $validated = $request->validate([
            'reply' => 'required|string|max:1000',
        ]);

        $adminId = auth()->id();
        $this->reviewService->replyToReview((int) $id, $validated['reply'], $adminId);

        return response()->json([
            'success' => true,
            'message' => 'پاسخ ثبت شد',
        ]);
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

        $result = $this->reviewService->bulkAction($validated['ids'], $validated['action']);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * حذف نظر
     */
    public function destroy($id)
    {
        $this->reviewService->deleteReview((int) $id);

        return response()->json([
            'success' => true,
            'message' => 'نظر حذف شد',
        ]);
    }
}