<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminAccessService;
use Illuminate\Http\Request;

/**
 * مدیریت Administrative Access (نقش Super Admin/Admin/Manager +
 * Permission های مستقیم هر کاربر) — لایه‌ی مستقل از users.role.
 *
 * همه‌ی این route ها زیر همان گروه admin middleware موجودند + پشت
 * permission:admin.access.view یا admin.access.manage (رجوع به
 * routes/api.php)؛ hierarchy/delegation/self-modification واقعی همیشه
 * در AdminAccessService enforce می‌شود، نه اینجا.
 */
class AdminAccessController extends Controller
{
    public function __construct(protected AdminAccessService $service) {}

    public function users(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);

        return response()->json(['success' => true, 'data' => $this->service->listUsers($perPage)]);
    }

    public function show(int $id)
    {
        return response()->json(['success' => true, 'data' => $this->service->getUserAccess($id)]);
    }

    public function roles()
    {
        return response()->json(['success' => true, 'data' => $this->service->getRoles()]);
    }

    public function permissions()
    {
        return response()->json(['success' => true, 'data' => $this->service->getPermissionsTaxonomy()]);
    }

    public function updateRole(Request $request, int $id)
    {
        $validated = $request->validate([
            'role' => 'nullable|in:super_admin,admin,manager',
        ]);

        try {
            $user = $this->service->assignAdministrativeRole(
                $request->user(),
                $id,
                $validated['role'] ?? null
            );

            return response()->json(['success' => true, 'message' => 'نقش Administrative به‌روزرسانی شد', 'data' => $user]);
        } catch (\Exception $e) {
            $status = $e->getCode();
            $status = ($status >= 400 && $status < 600) ? $status : 400;

            return response()->json(['success' => false, 'message' => $e->getMessage()], $status);
        }
    }

    public function updatePermissions(Request $request, int $id)
    {
        $validated = $request->validate([
            'permissions' => 'present|array',
            'permissions.*' => 'string',
        ]);

        try {
            $user = $this->service->setUserPermissions(
                $request->user(),
                $id,
                $validated['permissions']
            );

            return response()->json(['success' => true, 'message' => 'Permission ها به‌روزرسانی شدند', 'data' => $user]);
        } catch (\Exception $e) {
            $status = $e->getCode();
            $status = ($status >= 400 && $status < 600) ? $status : 400;

            return response()->json(['success' => false, 'message' => $e->getMessage()], $status);
        }
    }
}
