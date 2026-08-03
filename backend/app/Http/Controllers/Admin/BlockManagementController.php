<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BlockManagementController extends Controller
{
    /**
     * لیست همه بلاک‌ها با فیلتر
     */
    public function index(Request $request)
    {
        try {
            $query = BlockedUser::with([
                'user:id,name,email,avatar',
                'blockedUser:id,name,email,avatar',
            ]);

            // فیلتر بر اساس کاربر بلاک‌کننده
            if ($request->filled('blocker_id')) {
                $query->where('user_id', $request->blocker_id);
            }

            // فیلتر بر اساس کاربر بلاک‌شده
            if ($request->filled('blocked_id')) {
                $query->where('blocked_user_id', $request->blocked_id);
            }

            // فیلتر بر اساس دلیل
            if ($request->filled('reason') && $request->reason !== 'all') {
                $query->where('reason', $request->reason);
            }

            // فیلتر بر اساس تاریخ
            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // جستجو
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })->orWhereHas('blockedUser', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
                });
            }

            $blocks = $query->orderByDesc('created_at')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => [
                    'blocks' => $blocks->items(),
                    'pagination' => [
                        'current_page' => $blocks->currentPage(),
                        'last_page' => $blocks->lastPage(),
                        'per_page' => $blocks->perPage(),
                        'total' => $blocks->total(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('BlockManagementController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت لیست بلاک‌ها',
            ], 500);
        }
    }

    /**
     * آمار بلاک‌ها
     */
    public function stats()
    {
        try {
            $totalBlocks = BlockedUser::count();
            $todayBlocks = BlockedUser::whereDate('created_at', today())->count();
            $weekBlocks = BlockedUser::whereDate('created_at', '>=', now()->subDays(7))->count();
            $monthBlocks = BlockedUser::whereDate('created_at', '>=', now()->subDays(30))->count();

            // آمار بر اساس دلیل
            $byReason = BlockedUser::selectRaw('reason, count(*) as count')
                ->whereNotNull('reason')
                ->where('reason', '!=', '')
                ->groupBy('reason')
                ->get()
                ->pluck('count', 'reason');

            // بیشترین کاربران بلاک‌شده
            $mostBlockedUsers = User::select('users.id', 'users.name', 'users.email')
                ->selectSub(function ($query) {
                    $query->selectRaw('COUNT(*)')
                        ->from('blocked_users')
                        ->whereColumn('blocked_user_id', 'users.id');
                }, 'blocked_count')
                ->having('blocked_count', '>', 0)
                ->orderByDesc('blocked_count')
                ->limit(5)
                ->get();

            // بیشترین کاربران بلاک‌کننده
            $mostBlockers = User::select('users.id', 'users.name', 'users.email')
                ->selectSub(function ($query) {
                    $query->selectRaw('COUNT(*)')
                        ->from('blocked_users')
                        ->whereColumn('user_id', 'users.id');
                }, 'block_count')
                ->having('block_count', '>', 0)
                ->orderByDesc('block_count')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalBlocks,
                    'today' => $todayBlocks,
                    'week' => $weekBlocks,
                    'month' => $monthBlocks,
                    'by_reason' => $byReason,
                    'most_blocked_users' => $mostBlockedUsers,
                    'most_blockers' => $mostBlockers,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('BlockManagementController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار',
            ], 500);
        }
    }

    /**
     * آنبلاک کردن کاربر توسط ادمین
     */
    public function unblock($id)
    {
        try {
            $block = BlockedUser::findOrFail($id);
            $block->delete();

            return response()->json([
                'success' => true,
                'message' => 'کاربر با موفقیت آنبلاک شد',
            ]);
        } catch (\Exception $e) {
            Log::error('BlockManagementController@unblock: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در آنبلاک کردن',
            ], 500);
        }
    }

    /**
     * آنبلاک کردن همه بلاک‌های یک کاربر
     */
    public function unblockAll(Request $request, $userId)
    {
        try {
            $deleted = BlockedUser::where('blocked_user_id', $userId)->delete();

            return response()->json([
                'success' => true,
                'message' => "همه بلاک‌های کاربر حذف شدند ({$deleted} مورد)",
            ]);
        } catch (\Exception $e) {
            Log::error('BlockManagementController@unblockAll: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در آنبلاک کردن',
            ], 500);
        }
    }

    /**
     * بلاک کردن کاربر توسط ادمین (بلاک سراسری)
     */
    public function blockByAdmin(Request $request)
    {
        try {
            $validated = $request->validate([
                'blocked_user_id' => 'required|integer|exists:users,id',
                'reason' => 'required|string|max:500',
            ]);

            $admin = $request->user();

            // بررسی اینکه قبلاً بلاک نشده باشد
            $exists = BlockedUser::where('user_id', $admin->id)
                ->where('blocked_user_id', $validated['blocked_user_id'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'این کاربر قبلاً بلاک شده است',
                ], 400);
            }

            $block = BlockedUser::create([
                'user_id' => $admin->id,
                'blocked_user_id' => $validated['blocked_user_id'],
                'reason' => $validated['reason'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'کاربر با موفقیت بلاک شد',
                'data' => $block->load(['user:id,name', 'blockedUser:id,name']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('BlockManagementController@blockByAdmin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بلاک کردن',
            ], 500);
        }
    }
}