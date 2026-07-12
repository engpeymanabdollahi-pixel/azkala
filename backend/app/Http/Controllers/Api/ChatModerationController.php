<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlockedUser;
use App\Models\ChatReport;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatModerationController extends Controller
{
    /**
     * لیست کاربران بلاک شده
     */
    public function getBlockedUsers(Request $request)
    {
        try {
            $blockedUsers = BlockedUser::with('blockedUser:id,name,avatar')
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->get();

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

            $blocked = BlockedUser::firstOrCreate([
                'user_id' => $userId,
                'blocked_user_id' => $blockedUserId,
            ], ['reason' => $validated['reason'] ?? null]);

            // پایان دادن به مکالمات فعال
            Conversation::where(function ($query) use ($userId, $blockedUserId) {
                $query->where('buyer_id', $userId)->where('seller_id', $blockedUserId);
            })->orWhere(function ($query) use ($userId, $blockedUserId) {
                $query->where('buyer_id', $blockedUserId)->where('seller_id', $userId);
            })->update(['is_active' => false]);

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
            $deleted = BlockedUser::where('user_id', $request->user()->id)
                ->where('blocked_user_id', $blockedUserId)
                ->delete();

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
            $isBlocked = BlockedUser::where('user_id', $request->user()->id)
                ->where('blocked_user_id', $userId)
                ->exists();

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

            $report = ChatReport::create([
                'reporter_id' => $request->user()->id,
                'reported_user_id' => $validated['reported_user_id'],
                'conversation_id' => $validated['conversation_id'] ?? null,
                'message_id' => $validated['message_id'] ?? null,
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
            ]);

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