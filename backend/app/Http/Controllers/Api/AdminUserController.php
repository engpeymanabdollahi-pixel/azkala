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
        /**
     * مرحله ۲: تایید اولیه توسط ادمین و ارسال نوتیفیکیشن به فروشنده
     */
    public function initialApproveRequest($id)
    {
        $request = \App\Models\SellerRequest::findOrFail($id);
        
        if ($request->status !== 'pending_initial') {
            return response()->json(['success' => false, 'message' => 'این درخواست در وضعیت مناسبی برای تایید اولیه نیست.'], 400);
        }

        // ۱. تغییر وضعیت به pending_documents
        $request->update([
            'status' => 'pending_documents',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // ۲. ارسال نوتیفیکیشن به کاربر
        \App\Models\Notification::create([
            'user_id' => $request->user_id,
            'type' => 'seller_request_initial_approved',
            'title' => 'تایید اولیه درخواست فروشندگی',
            'message' => 'درخواست اولیه شما تایید شد. لطفاً برای تکمیل مدارک (تصویر کارت ملی و جواز کسب) و افتتاح نهایی شعبه، به پنل فروشندگی مراجعه کنید.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تایید اولیه انجام شد و نوتیفیکیشن برای کاربر ارسال گردید.'
        ]);
    }

    /**
     * مرحله ۴: تایید نهایی توسط ادمین (پس از آپلود مدارک توسط فروشنده)
     */
    public function finalApproveRequest($id)
    {
        $request = \App\Models\SellerRequest::findOrFail($id);
        
        if ($request->status !== 'pending_final') {
            return response()->json(['success' => false, 'message' => 'این درخواست هنوز مدارک آن تکمیل نشده است.'], 400);
        }

        // ۱. تغییر وضعیت به approved
        $request->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        // ۲. تغییر نقش کاربر به seller
        $request->user()->update(['role' => 'seller']);

        // ۳. ارسال نوتیفیکیشن موفقیت نهایی
        \App\Models\Notification::create([
            'user_id' => $request->user_id,
            'type' => 'seller_request_final_approved',
            'title' => 'تبریک! شعبه شما افتتاح شد',
            'message' => 'مدارک شما با موفقیت تایید شد. اکنون می‌توانید وارد پنل فروشندگی شده و محصولات خود را ثبت کنید.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'فروشندگی کاربر تایید نهایی شد و نقش او به فروشنده تغییر کرد.'
        ]);
    }
}