<?php

namespace App\Services\Admin;

use App\Models\DeviceBrand;
use App\Repositories\AdminDeviceBrandRepository;

class AdminDeviceBrandService
{
    public function __construct(protected AdminDeviceBrandRepository $repository) {}

    /**
     * دریافت لیست برندها
     */
    public function getBrands(array $filters = [], int $perPage = 20): array
    {
        $brands = $this->repository->getBrands($filters, $perPage);

        return [
            'brands' => $brands->map(fn($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                // ✅ فاز ۱D: type فقط برای سازگاری نمایش داده می‌شود؛
                // family اکنون منبع حقیقت است.
                'type' => $b->type,
                'family_id' => $b->family_id,
                'family' => $b->family ? ['id' => $b->family->id, 'name' => $b->family->name, 'slug' => $b->family->slug] : null,
                'is_active' => (bool) $b->is_active,
                'created_at' => $b->created_at->format('Y-m-d H:i'),
            ]),
            'pagination' => [
                'current_page' => $brands->currentPage(),
                'last_page' => $brands->lastPage(),
                'total' => $brands->total(),
            ],
        ];
    }

    /**
     * ایجاد برند دستگاه
     */
    public function createBrand(array $data): DeviceBrand
    {
        return $this->repository->create($data);
    }

    /**
     * به‌روزرسانی برند دستگاه
     */
    public function updateBrand(int $id, array $data): DeviceBrand
    {
        $brand = $this->repository->findOrFail($id);
        return $this->repository->update($brand, $data);
    }

    /**
     * حذف برند دستگاه
     */
    public function deleteBrand(int $id): bool
    {
        $brand = $this->repository->findOrFail($id);
        return $this->repository->delete($brand);
    }
}