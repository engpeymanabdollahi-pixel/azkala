<?php

namespace App\Services\Admin;

use App\Models\DeviceFamily;
use App\Repositories\AdminDeviceFamilyRepository;

class AdminDeviceFamilyService
{
    public function __construct(protected AdminDeviceFamilyRepository $repository) {}

    public function getFamilies(array $filters = [], int $perPage = 50): array
    {
        $families = $this->repository->getFamilies($filters, $perPage);

        return [
            'families' => $families->map(fn ($f) => $this->format($f)),
            'pagination' => [
                'current_page' => $families->currentPage(),
                'last_page' => $families->lastPage(),
                'total' => $families->total(),
            ],
        ];
    }

    public function getFamily(int $id): array
    {
        $family = $this->repository->findOrFail($id)->loadCount('brands');
        $family->load('categories:id,name,slug');

        return $this->format($family, true);
    }

    public function createFamily(array $data): DeviceFamily
    {
        return $this->repository->create($data);
    }

    public function updateFamily(int $id, array $data): DeviceFamily
    {
        $family = $this->repository->findOrFail($id);

        return $this->repository->update($family, $data);
    }

    public function deleteFamily(int $id): bool
    {
        $family = $this->repository->findOrFail($id);

        return $this->repository->delete($family);
    }

    protected function format(DeviceFamily $family, bool $detailed = false): array
    {
        $data = [
            'id' => $family->id,
            'name' => $family->name,
            'slug' => $family->slug,
            'description' => $family->description,
            'icon' => $family->icon,
            'sort_order' => $family->sort_order,
            'is_active' => (bool) $family->is_active,
            'brands_count' => $family->brands_count ?? 0,
            'created_at' => $family->created_at?->format('Y-m-d H:i'),
        ];

        if ($detailed) {
            $data['categories'] = $family->categories->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]);
        }

        return $data;
    }
}
