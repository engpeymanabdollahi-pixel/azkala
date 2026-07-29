<?php

namespace App\Repositories;

use App\Models\DeviceModel;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class AdminDeviceModelRepository
{
    public function getModels(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = DeviceModel::with(['series:id,name,brand_id', 'series.brand:id,name']);

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        if (!empty($filters['series_id'])) {
            $query->where('series_id', $filters['series_id']);
        }

        if (!empty($filters['brand_id'])) {
            $query->whereHas('series', function ($q) use ($filters) {
                $q->where('brand_id', $filters['brand_id']);
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->orderBy('release_year', 'desc')->orderBy('name', 'asc')->paginate($perPage);
    }

    public function findOrFail(int $id): DeviceModel
    {
        return DeviceModel::with('series.brand')->findOrFail($id);
    }

    public function create(array $data): DeviceModel
    {
        if (empty($data['slug'])) {
            $data['slug'] = \Str::slug($data['name']);
        }
        return DeviceModel::create($data);
    }

    public function update(DeviceModel $model, array $data): DeviceModel
    {
        $model->update($data);
        return $model->fresh();
    }

    public function delete(DeviceModel $model): bool
    {
        // بررسی اینکه آیا این مدل به محصولی متصل است یا خیر
        $hasProducts = DB::table('products')->where('device_model_id', $model->id)->exists() ||
                       DB::table('device_model_product')->where('device_model_id', $model->id)->exists();

        if ($hasProducts) {
            throw new BadRequestHttpException('این مدل دستگاه به یک یا چند محصول متصل است و قابل حذف نیست.');
        }
        return $model->delete();
    }
}