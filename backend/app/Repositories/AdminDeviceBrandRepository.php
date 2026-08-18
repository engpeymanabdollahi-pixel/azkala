<?php

namespace App\Repositories;

use App\Models\DeviceBrand;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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
    /**
     * ✅ Delete/Data-Integrity Audit: بررسی وابستگی (سری) و خودِ حذف در یک
     * تراکنش با lockForUpdate روی خودِ برند انجام می‌شود تا بین چک و حذف
     * پنجره‌ی race برای ساخته‌شدن یک سری‌ی جدید هم‌زمان بسته شود.
     */
    public function delete(DeviceBrand $brand): bool
    {
        return DB::transaction(function () use ($brand) {
            DeviceBrand::where('id', $brand->id)->lockForUpdate()->firstOrFail();

            if ($brand->series()->exists()) {
                throw new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException('این برند دارای سری دستگاه است و قابل حذف نیست.');
            }

            return $brand->delete();
        });
    }
}