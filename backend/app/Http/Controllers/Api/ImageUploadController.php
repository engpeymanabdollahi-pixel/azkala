<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ImageUploadController extends Controller
{
    /**
     * آپلود و بهینه‌سازی تصاویر با مدیریت خطای قوی
     */
    public function upload(Request $request)
    {
        // ۱. اعتبارسنجی
        $request->validate([
            'images'   => 'required|array|max:5',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $uploadedUrls = [];
        $failedFiles = [];
        $path = 'products/' . date('Y/m/d');

        foreach ($request->file('images') as $imageFile) {
            $tempPath = $imageFile->getPathname();
            $originalName = $imageFile->getClientOriginalName();
            
            try {
                // ۲. خواندن تصویر
                $sourceImage = $this->loadImage($tempPath, $imageFile->getMimeType());
                
                if (!$sourceImage) {
                    $failedFiles[] = $originalName . ' (فرمت پشتیبانی نمی‌شود یا فایل خراب است)';
                    continue;
                }

                // ۳. تغییر سایز
                $width = imagesx($sourceImage);
                if ($width > 1024) {
                    $resizedImage = imagescale($sourceImage, 1024, -1, IMG_BICUBIC_FIXED);
                    imagedestroy($sourceImage);
                    $sourceImage = $resizedImage;
                }

                // ۴. ذخیره با فرمت WebP یا JPEG
                $isWebpSupported = function_exists('imagewebp');
                $extension = $isWebpSupported ? 'webp' : 'jpg';
                $outputTemp = sys_get_temp_dir() . '/' . Str::uuid() . '.' . $extension;
                
                if ($isWebpSupported) {
                    imagewebp($sourceImage, $outputTemp, 85);
                } else {
                    imagejpeg($sourceImage, $outputTemp, 85);
                }
                imagedestroy($sourceImage);

                // ۵. انتقال به Storage
                $finalName = Str::uuid() . '.' . $extension;
                $fullPath = $path . '/' . $finalName;
                
                $fileContent = file_get_contents($outputTemp);
                Storage::disk('public')->put($fullPath, $fileContent);
                
                @unlink($outputTemp);

                $uploadedUrls[] = Storage::disk('public')->url($fullPath);
                
            } catch (\Exception $e) {
                Log::error('Image upload error: ' . $e->getMessage());
                $failedFiles[] = $originalName . ' (' . $e->getMessage() . ')';
                continue;
            }
        }

        // ۶. پاسخ نهایی
        if (empty($uploadedUrls)) {
            return response()->json([
                'success' => false,
                'message' => 'هیچ تصویری آپلود نشد. فایل‌های نامعتبر: ' . implode(', ', $failedFiles),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => count($uploadedUrls) . ' تصویر آپلود شد' . 
                         (count($failedFiles) > 0 ? ' (' . count($failedFiles) . ' فایل نامعتبر)' : ''),
            'urls'    => $uploadedUrls,
            'failed'  => $failedFiles,
        ]);
    }

    /**
     * بارگذاری تصویر با مدیریت خطای قوی
     */
    private function loadImage(string $path, string $mime)
    {
        try {
            // بررسی وجود فایل
            if (!file_exists($path)) {
                return null;
            }

            switch ($mime) {
                case 'image/jpeg':
                case 'image/jpg':
                    $img = @imagecreatefromjpeg($path);
                    return $img ?: null;
                    
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
                        $img = @imagecreatefromwebp($path);
                        return $img ?: null;
                    }
                    return null;
                    
                default:
                    return null;
            }
        } catch (\Exception $e) {
            Log::error('loadImage error: ' . $e->getMessage());
            return null;
        }
    }
}