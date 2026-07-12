<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminSettingController extends Controller
{
    protected AdminSettingService $settingService;

    public function __construct(AdminSettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    /**
     * دریافت لیست همه تنظیمات
     */
    public function index(Request $request)
    {
        try {
            $data = $this->settingService->getGroupedSettings(
                $request->get('group'),
                $request->get('search')
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * به‌روزرسانی گروهی تنظیمات
     */
    public function updateGroup(Request $request, string $group)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $userId = $request->user()->id;
            $updated = $this->settingService->updateGroup(
                $group,
                $validated['settings'],
                $userId,
                $validated['note'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => count($updated) . ' تنظیم به‌روزرسانی شد',
                'data' => ['updated_keys' => $updated],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@updateGroup: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * به‌روزرسانی یک تنظیم
     */
    public function update(Request $request, string $key)
    {
        $validated = $request->validate([
            'value' => 'nullable',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $userId = $request->user()->id;
            $this->settingService->updateSetting(
                $key,
                $validated['value'],
                $userId,
                $validated['note'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'تنظیم با موفقیت به‌روزرسانی شد',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * قفل/باز کردن تنظیم
     */
    public function toggleLock(Request $request, string $key)
    {
        try {
            $isLocked = $this->settingService->toggleLock($key);

            return response()->json([
                'success' => true,
                'message' => $isLocked ? 'تنظیم قفل شد' : 'قفل تنظیم باز شد',
                'data' => ['is_locked' => $isLocked],
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * تاریخچه تغییرات تنظیمات
     */
    public function history(Request $request)
    {
        try {
            $data = $this->settingService->getHistory(
                $request->get('group'),
                $request->get('key')
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * بازگشت به نسخه قبلی
     */
    public function rollback(Request $request, int $historyId)
    {
        try {
            $userId = $request->user()->id;
            $this->settingService->rollback($historyId, $userId);

            return response()->json([
                'success' => true,
                'message' => 'با موفقیت به نسخه قبلی بازگشت',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * مقداردهی اولیه تنظیمات پیش‌فرض
     */
    public function seedDefaults()
    {
        try {
            $created = $this->settingService->seedDefaults();
            $total = count(config('azkala.settings_defaults'));

            return response()->json([
                'success' => true,
                'message' => "{$created} تنظیم جدید ایجاد شد (از {$total} تنظیم)",
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@seedDefaults: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Export تنظیمات به JSON
     */
    public function export(Request $request)
    {
        try {
            $data = $this->settingService->export($request->get('group'));

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@export: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Import تنظیمات از JSON
     */
    public function import(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
        ]);

        try {
            $userId = $request->user()->id;
            $imported = $this->settingService->import($validated['settings'], $userId);

            return response()->json([
                'success' => true,
                'message' => "{$imported} تنظیم با موفقیت وارد شد",
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@import: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * تست SMTP
     */
    public function testSmtp(Request $request)
    {
        try {
            $result = $this->settingService->testSmtp();

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@testSmtp: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * تست پیامک
     */
    public function testSms(Request $request)
    {
        try {
            $result = $this->settingService->testSms();

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminSettingController@testSms: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}