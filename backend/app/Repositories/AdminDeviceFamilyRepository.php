<?php

namespace App\Repositories;

use App\Models\DeviceFamily;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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
    /**
     * ✅ Delete/Data-Integrity Audit: DeviceFamily (برخلاف Brand/Series/Model)
     * SoftDeletes ندارد — delete() اینجا واقعاً hard-delete است، پس این
     * تراکنش صرفاً «قفل خوش‌بینانه» نیست، واقعاً از race بین چک و حذف
     * جلوگیری می‌کند: بدون آن، بین دو خط بالا و return پایین، یک درخواست
     * هم‌زمان می‌توانست برندی به همین خانواده وصل کند.
     */
    public function delete(DeviceFamily $family): bool
    {
        return DB::transaction(function () use ($family) {
            DeviceFamily::where('id', $family->id)->lockForUpdate()->firstOrFail();

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
        });
    }
}
