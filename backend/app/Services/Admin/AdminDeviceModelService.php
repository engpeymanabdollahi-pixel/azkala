<?php

namespace App\Services\Admin;

use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Repositories\AdminDeviceModelRepository;

class AdminDeviceModelService
{
    public function __construct(protected AdminDeviceModelRepository $repository) {}

    public function getModels(array $filters = [], int $perPage = 20): array
    {
        $models = $this->repository->getModels($filters, $perPage);

        return [
            'models' => $models->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'slug' => $m->slug,
                'series_id' => $m->series_id,
                'series_name' => $m->series?->name,
                'brand_name' => $m->series?->brand?->name,
                'release_year' => $m->release_year,
                'is_active' => (bool) $m->is_active,
            ]),
            'pagination' => [
                'current_page' => $models->currentPage(),
                'last_page' => $models->lastPage(),
                'total' => $models->total(),
            ],
        ];
    }

    public function createModel(array $data): DeviceModel
    {
        return $this->repository->create($data);
    }

    public function updateModel(int $id, array $data): DeviceModel
    {
        $model = $this->repository->findOrFail($id);
        return $this->repository->update($model, $data);
    }

    public function deleteModel(int $id): bool
    {
        $model = $this->repository->findOrFail($id);
        return $this->repository->delete($model);
    }
    
    public function getSeriesList(?int $brandId = null): array
    {
        $query = DeviceSeries::where('is_active', true)->select('id', 'name', 'brand_id');
        if ($brandId) {
            $query->where('brand_id', $brandId);
        }
        return $query->orderBy('name')->get()->toArray();
    }
}