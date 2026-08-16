<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminStoreService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

/**
 * مدیریت ادمین روی فروشگاه‌های فیزیکی (Nearby Physical Stores — Phase 16).
 * دسترسی از طریق middleware استاندارد permission: در routes/api.php
 * enforce می‌شود (stores.view / stores.manage) — بدون هیچ سیستم
 * authorization موازی.
 */
class AdminStoreController extends Controller
{
    public function __construct(protected AdminStoreService $adminStoreService) {}

    public function index(Request $request)
    {
        $filters = [
            'status' => $request->get('status'),
            'search' => $request->get('search'),
        ];

        $stores = $this->adminStoreService->list($filters, (int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $stores,
        ]);
    }

    public function verify($id)
    {
        try {
            $store = $this->adminStoreService->verify((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'فروشگاه تایید شد و اکنون در جستجوی عمومی نمایش داده می‌شود.',
                'data' => $store,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'فروشگاه یافت نشد.'], 404);
        }
    }

    public function reject($id)
    {
        try {
            $this->adminStoreService->reject((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'فروشگاه رد شد.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'فروشگاه یافت نشد.'], 404);
        }
    }

    public function deactivate($id)
    {
        try {
            $store = $this->adminStoreService->deactivate((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'فروشگاه غیرفعال شد.',
                'data' => $store,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'فروشگاه یافت نشد.'], 404);
        }
    }

    public function activate($id)
    {
        try {
            $store = $this->adminStoreService->activate((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'فروشگاه فعال شد.',
                'data' => $store,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'فروشگاه یافت نشد.'], 404);
        }
    }
}
