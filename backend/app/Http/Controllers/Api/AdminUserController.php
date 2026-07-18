<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminUserController extends Controller
{
    protected AdminUserService $userService;

    public function __construct(AdminUserService $userService)
    {
        $this->userService = $userService;
    }

    public function index(Request $request)
    {
        try {
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
        } catch (\Exception $e) {
            Log::error('AdminUserController@index: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $data = $this->userService->getUserDetails((int) $id);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    public function updateRole(Request $request, $id)
    {
        $validated = $request->validate(['role' => 'required|in:customer,seller,admin']);
        try {
            $this->userService->updateUserRole((int) $id, $validated['role']);
            return response()->json(['success' => true, 'message' => 'نقش تغییر کرد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate(['is_active' => 'required|boolean']);
        try {
            $this->userService->updateUserStatus((int) $id, $validated['is_active']);
            return response()->json(['success' => true, 'message' => 'وضعیت تغییر کرد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    public function approveSeller($id)
    {
        try {
            $this->userService->approveSeller((int) $id);
            return response()->json(['success' => true, 'message' => 'فروشنده تأیید شد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function rejectSeller(Request $request, $id)
    {
        $validated = $request->validate(['reason' => 'required|string|max:500']);
        try {
            $this->userService->rejectSeller((int) $id);
            return response()->json(['success' => true, 'message' => 'فروشنده رد شد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function sellerRequests(Request $request)
    {
        try {
            $requests = \App\Models\SellerRequest::with('user:id,name,email,phone')->latest()->get();
            return response()->json([
                'success' => true,
                'data' => $requests,
                'message' => 'درخواست‌ها با موفقیت دریافت شدند'
            ]);
        } catch (\Exception $e) {
            Log::error('AdminUserController@sellerRequests: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * تأیید درخواست فروشندگی و تغییر نقش کاربر
     */
    public function approveSellerRequest($id)
    {
        try {
            $adminId = auth()->id();
            $this->userService->approveSellerRequest((int) $id, $adminId);

            return response()->json([
                'success' => true,
                'message' => 'درخواست فروشندگی تأیید شد و نقش کاربر به فروشنده تغییر کرد.',
            ]);
        } catch (\Exception $e) {
            Log::error('AdminUserController@approveSellerRequest: ' . $e->getMessage());
            
            $statusCode = $e->getCode();
            if (!is_int($statusCode) || $statusCode < 400 || $statusCode >= 600) {
                $statusCode = 500;
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * رد درخواست فروشندگی
     */
    public function rejectSellerRequest(Request $request, $id)
    {
        $validated = $request->validate(['reason' => 'required|string|max:500']);

        try {
            $adminId = auth()->id();
            $this->userService->rejectSellerRequest((int) $id, $adminId, $validated['reason']);

            return response()->json([
                'success' => true,
                'message' => 'درخواست فروشندگی رد شد.',
            ]);
        } catch (\Exception $e) {
            Log::error('AdminUserController@rejectSellerRequest: ' . $e->getMessage());
            
            $statusCode = $e->getCode();
            if (!is_int($statusCode) || $statusCode < 400 || $statusCode >= 600) {
                $statusCode = 500;
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
} // ✅ این آکولاد بسته حیاتی است که قبلاً گم شده بود