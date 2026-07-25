<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SellerSettingsController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'shop_name' => 'required|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $data = [
            'shop_name' => $request->shop_name,
            'bio' => $request->bio,
        ];

        if ($request->has('shop_name') && $request->shop_name !== $user->shop_name) {
            $data['slug'] = Str::slug($request->shop_name);
        }

        // ==========================================
        // ۱. پردازش لوگو (Avatar) با PHP GD (اثبات‌شده و پایدار)
        // ==========================================
        if ($request->hasFile('avatar')) {
            try {
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }
                
                $file = $request->file('avatar');
                $tempPath = $file->getRealPath();
                $mime = $file->getMimeType();
                
                $fileName = 'avatar_' . time() . '_' . Str::random(8) . '.webp';
                $path = 'seller/avatars/' . $fileName;
                $fullPath = storage_path('app/public/' . $path);

                if (!file_exists(dirname($fullPath))) {
                    mkdir(dirname($fullPath), 0755, true);
                }

                // بارگذاری تصویر
                $sourceImage = $this->loadImage($tempPath, $mime);
                
                if ($sourceImage) {
                    // تغییر سایز به حداکثر عرض 400 پیکسل
                    $width = imagesx($sourceImage);
                    if ($width > 400) {
                        $resizedImage = imagescale($sourceImage, 400, -1, IMG_BICUBIC_FIXED);
                        imagedestroy($sourceImage);
                        $sourceImage = $resizedImage;
                    }

                    // ذخیره به صورت WebP با کیفیت 80
                    imagewebp($sourceImage, $fullPath, 80);
                    imagedestroy($sourceImage);
                    
                    $data['avatar'] = $path;
                } else {
                    // اگر پردازش شکست خورد، فایل اصلی را ذخیره کن
                    $data['avatar'] = $file->store('seller/avatars', 'public');
                }

            } catch (\Exception $e) {
                Log::error('Seller Avatar Upload Error: ' . $e->getMessage());
                $data['avatar'] = $request->file('avatar')->store('seller/avatars', 'public');
            }
        }

        // ==========================================
        // ۲. پردازش بنر (Banner) با PHP GD
        // ==========================================
        if ($request->hasFile('banner')) {
            try {
                if ($user->banner) {
                    Storage::disk('public')->delete($user->banner);
                }
                
                $file = $request->file('banner');
                $tempPath = $file->getRealPath();
                $mime = $file->getMimeType();
                
                $fileName = 'banner_' . time() . '_' . Str::random(8) . '.webp';
                $path = 'seller/banners/' . $fileName;
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
                    
                    $data['banner'] = $path;
                } else {
                    $data['banner'] = $file->store('seller/banners', 'public');
                }

            } catch (\Exception $e) {
                Log::error('Seller Banner Upload Error: ' . $e->getMessage());
                $data['banner'] = $request->file('banner')->store('seller/banners', 'public');
            }
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'تنظیمات فروشگاه با موفقیت و با کیفیت بهینه به‌روزرسانی شد.',
            'data' => [
                'id' => $user->id,
                'shop_name' => $user->shop_name,
                'slug' => $user->slug,
                'bio' => $user->bio,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'banner' => $user->banner ? asset('storage/' . $user->banner) : null,
                'followers_count' => $user->followers_count,
            ]
        ]);
    }

    /**
     * بارگذاری تصویر با مدیریت خطای قوی (دقیقاً همان منطق ImageUploadController شما)
     */
    private function loadImage(string $path, string $mime)
    {
        try {
            if (!file_exists($path)) {
                return null;
            }

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
            Log::error('loadImage error: ' . $e->getMessage());
            return null;
        }
    }
}