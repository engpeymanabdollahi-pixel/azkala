<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminUserService;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(protected AdminUserService $userService) {}

    /**
     * لیست کاربران با فیلتر
     */
    public function index(Request $request)
    {
        $filters = [
            'role' => $request->get('role'),
            'is_active' => $request->get('is_active'),
            'online' => $request->get('online'),
            'conversations' => $request->get('conversations'),
            'sentiment' => $request->get('sentiment'),
            'reports' => $request->get('reports'),
            'search' => $request->get('search'),
            'sort_by' => $request->get('sort_by', 'created_at'),
            'sort_order' => $request->get('sort_order', 'desc'),
        ];

        $data = $this->userService->getUsers($filters, (int) $request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * نمایش جزئیات کاربر
     */
    public function show($id)
    {
        $data = $this->userService->getUserDetails((int) $id);
        
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * به‌روزرسانی نقش کاربر
     */
    public function updateRole(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => 'required|in:customer,seller,admin'
        ]);

        $this->userService->updateUserRole((int) $id, $validated['role']);

        return response()->json(['success' => true, 'message' => 'نقش تغییر کرد']);
    }

    /**
     * به‌روزرسانی وضعیت فعال/غیرفعال کاربر
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean'
        ]);

        $this->userService->updateUserStatus((int) $id, $validated['is_active']);

        return response()->json(['success' => true, 'message' => 'وضعیت تغییر کرد']);
    }

    /**
     * تأیید فروشنده (قدیمی)
     */
    public function approveSeller($id)
    {
        $this->userService->approveSeller((int) $id);
        
        return response()->json(['success' => true, 'message' => 'فروشنده تأیید شد']);
    }

    /**
     * رد فروشنده (قدیمی)
     */
    public function rejectSeller(Request $request, $id)
    {
        $request->validate(['reason' => 'required|string|max:500']);
        
        $this->userService->rejectSeller((int) $id);
        
        return response()->json(['success' => true, 'message' => 'فروشنده رد شد']);
    }

    /**
     * لیست درخواست‌های فروشندگی
     * ✅ اصلاح شد: استفاده از سرویس به جای کوئری مستقیم مدل
     */
    public function sellerRequests(Request $request)
    {
        $data = $this->userService->getSellerRequests((int) $request->get('per_page', 20));
        
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'درخواست‌ها با موفقیت دریافت شدند'
        ]);
    }

    /**
     * تأیید درخواست فروشندگی و تغییر نقش کاربر
     */
    public function approveSellerRequest($id)
    {
        $adminId = auth()->id();
        $this->userService->approveSellerRequest((int) $id, $adminId);

        return response()->json([
            'success' => true,
            'message' => 'درخواست فروشندگی تأیید شد و نقش کاربر به فروشنده تغییر کرد.',
        ]);
    }

    /**
     * رد درخواست فروشندگی
     */
    public function rejectSellerRequest(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $adminId = auth()->id();
        $this->userService->rejectSellerRequest((int) $id, $adminId, $validated['reason']);

        return response()->json([
            'success' => true,
            'message' => 'درخواست فروشندگی رد شد.',
        ]);
    }
}