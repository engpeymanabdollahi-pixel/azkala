<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerQuickReplyController extends Controller
{
    protected SellerService $sellerService;

    public function __construct(SellerService $sellerService)
    {
        $this->sellerService = $sellerService;
    }

    /**
     * لیست پاسخ‌های سریع
     */
    public function index(Request $request)
    {
        try {
            $sellerId = $request->query('seller_id') ?: $request->user()->id;
            $replies = $this->sellerService->getQuickReplies($sellerId);

            return response()->json([
                'success' => true,
                'data' => $replies,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerQuickReplyController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * ایجاد پاسخ سریع جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:50',
            'content' => 'required|string|max:500',
        ]);

        try {
            $sellerId = $request->query('seller_id') ?: $request->user()->id;
            $reply = $this->sellerService->createQuickReply(
                $sellerId,
                $validated['title'],
                $validated['content']
            );

            return response()->json([
                'success' => true,
                'data' => $reply,
            ], 201);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * حذف پاسخ سریع
     */
    public function destroy(Request $request, $id)
    {
        try {
            $sellerId = $request->query('seller_id') ?: $request->user()->id;
            $this->sellerService->deleteQuickReply((int) $id, $sellerId);

            return response()->json([
                'success' => true,
                'message' => 'حذف شد',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}