<?php

namespace App\Repositories;

use App\Models\DeviceBrand;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminDeviceBrandRepository
{
    /**
     * دریافت لیست برندهای دستگاه با فیلتر
     */
    public function getBrands(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = DeviceBrand::query()->with('family:id,name,slug');

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // ✅ Device-First Architecture فاز ۱E/۱H: فیلتر بر اساس family_id —
        // معادل داده‌محورِ فیلتر قدیمیِ type.
        if (!empty($filters['family_id'])) {
            $query->where('family_id', $filters['family_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * یافتن برند بر اساس ID
     */
    public function findOrFail(int $id): DeviceBrand
    {
        return DeviceBrand::findOrFail($id);
    }

    /**
     * ایجاد برند جدید
     */
    public function create(array $data): DeviceBrand
    {
        // تولید slug خودکار اگر ارائه نشده باشد
        if (empty($data['slug'])) {
            $data['slug'] = \Str::slug($data['name']);
        }
        return DeviceBrand::create($data);
    }

    /**
     * به‌روزرسانی برند
     */
    public function update(DeviceBrand $brand, array $data): DeviceBrand
    {
        $brand->update($data);
        return $brand;
    }

    /**
     * حذف برند
     */
    public function delete(DeviceBrand $brand): bool
    {
        // بررسی اینکه آیا این برند سری یا مدلی دارد یا خیر (اختیاری اما توصیه‌شده)
        if ($brand->series()->exists()) {
            throw new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException('این برند دارای سری دستگاه است و قابل حذف نیست.');
        }
        return $brand->delete();
    }
}