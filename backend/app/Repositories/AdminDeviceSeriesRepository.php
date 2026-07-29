<?php

namespace App\Repositories;

use App\Models\DeviceSeries;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AdminDeviceSeriesRepository
{
    public function getSeries(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = DeviceSeries::with('brand:id,name');

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        if (!empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findOrFail(int $id): DeviceSeries
    {
        return DeviceSeries::with('brand')->findOrFail($id);
    }

    public function create(array $data): DeviceSeries
    {
        if (empty($data['slug'])) {
            $data['slug'] = \Str::slug($data['name']);
        }
        return DeviceSeries::create($data);
    }

    public function update(DeviceSeries $series, array $data): DeviceSeries
    {
        $series->update($data);
        return $series->fresh();
    }

    public function delete(DeviceSeries $series): bool
    {
        // جلوگیری از حذف سری‌ای که مدل دارد
        if ($series->models()->exists()) {
            throw new BadRequestHttpException('این سری دارای مدل دستگاه است و قابل حذف نیست.');
        }
        return $series->delete();
    }
}