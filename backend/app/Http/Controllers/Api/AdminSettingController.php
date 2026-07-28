<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminSettingController extends Controller
{
    public function __construct(protected AdminSettingService $settingService) {}

    /**
     * دریافت لیست همه تنظیمات
     */
    public function index(Request $request)
    {
        $data = $this->settingService->getGroupedSettings(
            $request->get('group'),
            $request->get('search')
        );

        return response()->json(['success' => true, 'data' => $data]);
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

        $userId = $request->user()->id;
        $note = $request->input('note');
        $rawSettings = $request->input('settings', []);
        $updated = [];

        foreach ($rawSettings as $index => $settingData) {
            $key = $settingData['key'] ?? null;
            if (!$key) continue;

            $file = $request->file("settings.{$index}.value");
            $processedValue = $settingData['value'] ?? '';

            if ($file instanceof \Illuminate\Http\UploadedFile) {
                $request->validate([
                    "settings.{$index}.value" => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                ]);
                $processedValue = $this->processSettingImage($file, $key);
            }

            $this->settingService->updateSetting($key, $processedValue, $userId, $note);
            $updated[] = $key;
        }

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' تنظیم با موفقیت به‌روزرسانی شد',
            'data' => ['updated_keys' => $updated],
        ]);
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

        $this->settingService->updateSetting(
            $key,
            $validated['value'],
            $request->user()->id,
            $validated['note'] ?? null
        );

        return response()->json(['success' => true, 'message' => 'تنظیم با موفقیت به‌روزرسانی شد']);
    }

    /**
     * قفل/باز کردن تنظیم
     */
    public function toggleLock(Request $request, string $key)
    {
        $isLocked = $this->settingService->toggleLock($key);

        return response()->json([
            'success' => true,
            'message' => $isLocked ? 'تنظیم قفل شد' : 'قفل تنظیم باز شد',
            'data' => ['is_locked' => $isLocked],
        ]);
    }

    /**
     * تاریخچه تغییرات تنظیمات
     */
    public function history(Request $request)
    {
        $data = $this->settingService->getHistory(
            $request->get('group'),
            $request->get('key')
        );

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * بازگشت به نسخه قبل
     */
    public function rollback(Request $request, int $historyId)
    {
        $this->settingService->rollback($historyId, $request->user()->id);

        return response()->json(['success' => true, 'message' => 'با موفقیت به نسخه قبل بازگشت']);
    }

    /**
     * مقداردهی اولیه تنظیمات پیش‌فرض
     */
    public function seedDefaults()
    {
        $created = $this->settingService->seedDefaults();
        $total = count(config('azkala.settings_defaults') ?? []);

        return response()->json([
            'success' => true,
            'message' => "{$created} تنظیم جدید ایجاد شد (از {$total} تنظیم)",
        ]);
    }

    /**
     * Export تنظیمات به JSON
     */
    public function export(Request $request)
    {
        $data = $this->settingService->export($request->get('group'));

        return response()->json(['success' => true, 'data' => $data]);
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

        $imported = $this->settingService->import($validated['settings'], $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => "{$imported} تنظیم با موفقیت وارد شد",
        ]);
    }

    /**
     * تست SMTP
     */
    public function testSmtp()
    {
        $result = $this->settingService->testSmtp();

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
        ]);
    }

    /**
     * تست پیامک
     */
    public function testSms()
    {
        $result = $this->settingService->testSms();

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
        ]);
    }

    // ==========================================
    // Private Helper Methods for Image Processing
    // ==========================================

    private function processSettingImage(\Illuminate\Http\UploadedFile $file, string $key): string
    {
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
                return $path;
            }
        } catch (\Exception $e) {
            // Fallback to standard store on error
        }

        return $file->store('admin/settings', 'public');
    }

    private function loadImage(string $path, string $mime)
    {
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
                return function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) ?: null : null;
            default:
                return null;
        }
    }
}