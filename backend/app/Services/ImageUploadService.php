<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class ImageUploadService
{
    /**
     * آپلود و بهینه‌سازی تصویر
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $directory
     * @return string URL تصویر ذخیره شده
     */
    public function uploadAndOptimize($file, string $directory = 'products'): string
    {
        // تولید نام یکتا
        $filename = Str::uuid() . '.webp';
        $path = $directory . '/' . date('Y/m/d');

        // پردازش تصویر (Resize + Convert to WebP)
        $image = Image::read($file);
        $image->scale(1024); // حداکثر عرض ۱۰۲۴ پیکسل
        $image->toWebp(85); // کیفیت ۸۵٪

        // ذخیره در Storage
        Storage::disk('public')->put($path . '/' . $filename, $image->encode());

        return Storage::disk('public')->url($path . '/' . $filename);
    }
}