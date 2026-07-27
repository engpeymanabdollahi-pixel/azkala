<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
     * به‌روزرسانی گروهی تنظیمات (با پشتیبانی هوشمند از آپلود فایل)
     */
    public function updateGroup(Request $request, string $group)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $userId = $request->user()->id;
            $updated = [];
            $note = $request->input('note');
            $rawSettings = $request->input('settings', []);

            foreach ($rawSettings as $index => $settingData) {
                $key = $settingData['key'] ?? null;
                if (!$key) continue;

                // بررسی اینکه آیا برای این ایندکس، فایل آپلود شده است یا خیر
                $file = $request->file("settings.{$index}.value");
                
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    // پردازش فایل با سیستم بهینه‌سازی اثبات‌شده (PHP GD)
                    $request->validate([
                        "settings.{$index}.value" => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                    ]);

                    try {
                        $tempPath = $file->getRealPath();
                        $mime = $file->getMimeType();
                        
                        $fileName = $key . '_' . time() . '_' . Str::random(8) . '.webp';
                        $path = 'admin/settings/' . $fileName;
                        $fullPath = storage_path('app/public/' . $path);

                        if (!file_exists(dirname($fullPath))) {
                            mkdir(dirname($fullPath), 0755, true);
                        }

                        $sourceImage = $this->loadImage($tempPath, $mime);
                        
                        if ($sourceImage) {
                            $width = imagesx($sourceImage);
                            if ($width > 1200) {
                                $resizedImage = imagescale($sourceImage, 1200, -1, IMG_BICUBIC_FIXED);
                                imagedestroy($sourceImage);
                                $sourceImage = $resizedImage;
                            }

                            imagewebp($sourceImage, $fullPath, 80);
                            imagedestroy($sourceImage);
                            
                            $processedValue = $path;
                        } else {
                            // مکانیزم سقوط ایمن
                            $processedValue = $file->store('admin/settings', 'public');
                        }
                    } catch (\Exception $e) {
                        Log::error('Admin Setting Image Upload Error: ' . $e->getMessage());
                        $processedValue = $file->store('admin/settings', 'public');
                    }
                } else {
                    // اگر فایل نبود، مقدار متنی را حفظ کن
                    $processedValue = $settingData['value'] ?? '';
                }

                // ذخیره در دیتابیس
                $this->settingService->updateSetting($key, $processedValue, $userId, $note);
                $updated[] = $key;
            }

            return response()->json([
                'success' => true,
                'message' => count($updated) . ' تنظیم با موفقیت به‌روزرسانی شد',
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

    /**
     * بارگذاری تصویر با مدیریت خطای قوی (متد کمکی برای بهینه‌سازی عکس)
     */
    private function loadImage(string $path, string $mime)
    {
        try {
            if (!file_exists($path)) return null;
            switch ($mime) {
                case 'image/jpeg':
                case 'image/jpg':
                    return @imagecreatefromjpeg($path) ?: null;
                case 'image/png':
                    $img = @imagecreatefrompng($path);
                    if ($img) {
                        imagepalettetotruecolor($img);
                        imagealphablending($img, true);
                        imagesavealpha($img, true);
                    }
                    return $img ?: null;
                case 'image/webp':
                    if (function_exists('imagecreatefromwebp')) {
                        return @imagecreatefromwebp($path) ?: null;
                    }
                    return null;
                default:
                    return null;
            }
        } catch (\Exception $e) {
            return null;
        }
    }
}