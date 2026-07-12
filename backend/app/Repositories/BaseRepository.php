<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

abstract class BaseRepository implements RepositoryInterface
{
    /**
     * @var Model
     */
    protected Model $model;

    /**
     * BaseRepository constructor
     */
    public function __construct()
    {
        $this->makeModel();
    }

    /**
     * Specify Model class name
     */
    abstract protected function model(): string;

    /**
     * Make model instance
     */
    protected function makeModel(): Model
    {
        $model = app($this->model());

        if (!$model instanceof Model) {
            throw new \Exception("Class {$this->model()} must be an instance of Illuminate\\Database\\Eloquent\\Model");
        }

        return $this->model = $model;
    }

    /**
     * Get all models
     */
    public function all(array $columns = ['*']): Collection
    {
        return $this->model->all($columns);
    }

    /**
     * Find model by id
     */
    public function find(int $id, array $columns = ['*']): ?Model
    {
        return $this->model->find($id, $columns);
    }

    /**
     * Find model by id or fail
     */
    public function findOrFail(int $id, array $columns = ['*']): Model
    {
        return $this->model->findOrFail($id, $columns);
    }

    /**
     * Find by specific column
     */
    public function findBy(string $column, mixed $value, array $columns = ['*']): ?Model
    {
        return $this->model->where($column, $value)->first($columns);
    }

    /**
     * Create new model
     */
    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    /**
     * Update model
     */
    public function update(Model $model, array $data): Model
    {
        $model->update($data);
        return $model;
    }

    /**
     * Delete model
     */
    public function delete(Model $model): bool
    {
        return $model->delete();
    }

    /**
     * Paginate results
     */
    public function paginate(int $perPage = 15, array $columns = ['*'])
    {
        return $this->model->paginate($perPage, $columns);
    }

    /**
     * Get query builder
     */
    public function query(): Builder
    {
        return $this->model->query();
    }
}