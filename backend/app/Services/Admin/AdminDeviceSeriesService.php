<?php

namespace App\Services\Admin;

use App\Models\DeviceSeries;
use App\Repositories\AdminDeviceSeriesRepository;

class AdminDeviceSeriesService
{
    public function __construct(protected AdminDeviceSeriesRepository $repository) {}

    public function getSeries(array $filters = [], int $perPage = 20): array
    {
        $series = $this->repository->getSeries($filters, $perPage);

        return [
            'series' => $series->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'brand_id' => $s->brand_id,
                'brand_name' => $s->brand?->name,
                'is_active' => (bool) $s->is_active,
                'created_at' => $s->created_at->format('Y-m-d H:i'),
            ]),
            'pagination' => [
                'current_page' => $series->currentPage(),
                'last_page' => $series->lastPage(),
                'total' => $series->total(),
            ],
        ];
    }

    public function createSeries(array $data): DeviceSeries
    {
        return $this->repository->create($data);
    }

    public function updateSeries(int $id, array $data): DeviceSeries
    {
        $series = $this->repository->findOrFail($id);
        return $this->repository->update($series, $data);
    }

    public function deleteSeries(int $id): bool
    {
        $series = $this->repository->findOrFail($id);
        return $this->repository->delete($series);
    }
    
    // متد کمکی برای گرفتن لیست برندها جهت نمایش در Dropdown فرانت‌اند
    public function getBrandsList(): array
    {
        return \App\Models\DeviceBrand::where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->toArray();
    }
}