<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminAccessLog;
use Illuminate\Http\Request;

/**
 * Controller برای مشاهده لاگ‌های تغییر دسترسی مدیریتی (AdminAccessLog).
 *
 * این Controller فقط READ-ONLY است — هیچ عملیات write ندارد (AdminAccessLog
 * append-only است و فقط توسط AdminAccessService نوشته می‌شود).
 *
 * Authorization: permission:admin.access.view
 *   - در config/azkala/permissions.php تعریف شده (sensitive: false)
 *   - Admin و Super Admin به‌صورت پیش‌فرض دسترسی دارند
 *   - Manager باید توسط Super Admin صریحاً اعطا شود
 */
class AdminAccessLogController extends Controller
{
    /**
     * لیست لاگ‌های دسترسی با pagination و فیلتر.
     *
     * Query params:
     *   - per_page: int (default 20, max 100)
     *   - page: int
     *   - actor_user_id: int (فیلتر بر اساس ادمین‌کننده)
     *   - target_user_id: int (فیلتر بر اساس کاربر هدف)
     *   - action: string (admin_role_assigned|admin_role_removed|permission_granted|permission_revoked)
     *   - date_from: Y-m-d
     *   - date_to: Y-m-d
     *   - sort: asc|desc (default desc)
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page'        => 'nullable|integer|min:1|max:100',
            'page'            => 'nullable|integer|min:1',
            'actor_user_id'   => 'nullable|integer|exists:users,id',
            'target_user_id'  => 'nullable|integer|exists:users,id',
            'action'          => 'nullable|string|in:admin_role_assigned,admin_role_removed,permission_granted,permission_revoked',
            'date_from'       => 'nullable|date',
            'date_to'         => 'nullable|date|after_or_equal:date_from',
            'sort'            => 'nullable|in:asc,desc',
        ]);

        $query = AdminAccessLog::query()
            ->with([
                'actor:id,name,email,phone',
                'target:id,name,email,phone',
            ])
            ->orderBy('created_at', $validated['sort'] ?? 'desc');

        // اعمال فیلترها
        if (! empty($validated['actor_user_id'])) {
            $query->where('actor_user_id', $validated['actor_user_id']);
        }

        if (! empty($validated['target_user_id'])) {
            $query->where('target_user_id', $validated['target_user_id']);
        }

        if (! empty($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $perPage = $validated['per_page'] ?? 20;
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * لیست actions موجود (برای dropdown فیلتر در UI).
     */
    public function actions()
    {
        return response()->json([
            'success' => true,
            'data'    => [
                AdminAccessLog::ACTION_ROLE_ASSIGNED     => 'تخصیص نقش',
                AdminAccessLog::ACTION_ROLE_REMOVED      => 'حذف نقش',
                AdminAccessLog::ACTION_PERMISSION_GRANTED => 'اعطای دسترسی',
                AdminAccessLog::ACTION_PERMISSION_REVOKED => 'لغو دسترسی',
            ],
        ]);
    }
}