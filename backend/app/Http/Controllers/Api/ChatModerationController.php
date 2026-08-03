<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChatModerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatModerationController extends Controller
{
    protected ChatModerationService $chatModerationService;

    public function __construct(ChatModerationService $chatModerationService)
    {
        $this->chatModerationService = $chatModerationService;
    }

    /**
     * لیست کاربران بلاک شده
     */
    public function getBlockedUsers(Request $request)
    {
        try {
            $blockedUsers = $this->chatModerationService->getBlockedUsers($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $blockedUsers,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatModerationController@getBlockedUsers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت لیست بلاک',
            ], 500);
        }
    }

    /**
     * بلاک کردن کاربر
     */
    public function blockUser(Request $request)
    {
        try {
            $validated = $request->validate([
                'blocked_user_id' => 'required|integer|exists:users,id',
                'reason' => 'nullable|string|max:500',
            ]);

            $userId = $request->user()->id;
            $blockedUserId = $validated['blocked_user_id'];

            if ($userId === $blockedUserId) {
                return response()->json([
                    'success' => false,
                    'message' => 'نمی‌توانید خودتان را بلاک کنید',
                ], 400);
            }

            $blocked = $this->chatModerationService->blockUser($userId, $blockedUserId, $validated['reason'] ?? null);

            return response()->json([
                'success' => true,
                'message' => 'کاربر بلاک شد',
                'data' => $blocked,
            ], 201);
        } catch (\Exception $e) {
            Log::error('ChatModerationController@blockUser: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بلاک کردن کاربر',
            ], 500);
        }
    }

    /**
     * آنبلاک کردن کاربر
     */
    public function unblockUser(Request $request, $blockedUserId)
    {
        try {
            $deleted = $this->chatModerationService->unblockUser($request->user()->id, (int) $blockedUserId);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'این کاربر بلاک نشده بود',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'کاربر آنبلاک شد',
            ]);
        } catch (\Exception $e) {
            Log::error('ChatModerationController@unblockUser: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در آنبلاک کردن کاربر',
            ], 500);
        }
    }

    /**
     * بررسی وضعیت بلاک
     */
    public function checkBlockStatus(Request $request, $userId)
    {
        try {
            $isBlocked = $this->chatModerationService->isBlocked($request->user()->id, (int) $userId);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_blocked' => $isBlocked,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ChatModerationController@checkBlockStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بررسی وضعیت',
            ], 500);
        }
    }

    /**
     * گزارش تخلف
     */
    public function reportUser(Request $request)
    {
        try {
            $validated = $request->validate([
                'reported_user_id' => 'required|integer|exists:users,id',
                'conversation_id' => 'nullable|integer|exists:conversations,id',
                'message_id' => 'nullable|integer|exists:messages,id',
                'reason' => 'required|in:spam,harassment,inappropriate,scam,other',
                'description' => 'nullable|string|max:1000',
            ]);

            $report = $this->chatModerationService->reportUser($request->user()->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'گزارش شما ثبت شد و بررسی خواهد شد',
                'data' => $report,
            ], 201);
        } catch (\Exception $e) {
            Log::error('ChatModerationController@reportUser: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ثبت گزارش',
            ], 500);
        }
    }
}