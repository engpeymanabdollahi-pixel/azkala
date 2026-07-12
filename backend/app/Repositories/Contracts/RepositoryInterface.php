<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface RepositoryInterface
{
    /**
     * Get all models
     */
    public function all(array $columns = ['*']): Collection;

    /**
     * Find model by id
     */
    public function find(int $id, array $columns = ['*']): ?Model;

    /**
     * Find model by id or fail
     */
    public function findOrFail(int $id, array $columns = ['*']): Model;

    /**
     * Find by specific column
     */
    public function findBy(string $column, mixed $value, array $columns = ['*']): ?Model;

    /**
     * Create new model
     */
    public function create(array $data): Model;

    /**
     * Update model
     */
    public function update(Model $model, array $data): Model;

    /**
     * Delete model
     */
    public function delete(Model $model): bool;

    /**
     * Paginate results
     */
    public function paginate(int $perPage = 15, array $columns = ['*']);

    /**
     * Get query builder
     */
    public function query();
}