<?php

namespace App\Repositories;

use App\Models\DeviceFamily;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminDeviceFamilyRepository
{
    public function getFamilies(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = DeviceFamily::query()->withCount('brands');

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->orderBy('sort_order')->orderBy('name')->paginate($perPage);
    }

    public function findOrFail(int $id): DeviceFamily
    {
        return DeviceFamily::findOrFail($id);
    }

    public function create(array $data): DeviceFamily
    {
        if (empty($data['slug'])) {
            $data['slug'] = \Str::slug($data['name']);
        }

        return DeviceFamily::create($data);
    }

    public function update(DeviceFamily $family, array $data): DeviceFamily
    {
        $family->update($data);

        return $family;
    }

    /**
     * حذف واقعی (hard delete) فقط وقتی مجاز است که هیچ برند/دسته‌ای به این
     * خانواده وصل نباشد — طبق قانون صریح فاز ۱E: «حذف مخرب وقتی برند/دسته/
     * محصول وابسته دارد مجاز نیست؛ غیرفعال‌سازی ترجیح داده می‌شود».
     */
    public function delete(DeviceFamily $family): bool
    {
        if ($family->brands()->exists()) {
            throw new \Symfony\Component\HttpKernel\Exception\ConflictHttpException(
                'این خانواده‌ی دستگاه دارای برند وابسته است و قابل حذف نیست. آن را غیرفعال کنید.'
            );
        }

        if ($family->categories()->exists()) {
            throw new \Symfony\Component\HttpKernel\Exception\ConflictHttpException(
                'این خانواده‌ی دستگاه به دسته‌بندی‌هایی متصل است و قابل حذف نیست. آن را غیرفعال کنید.'
            );
        }

        return $family->delete();
    }
}
