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
        // ✅ Device-First Architecture فاز ۳: ستون products.device_model_id در
        // فاز ۱ حذف شد (device_model_product تنها منبع حقیقتِ سازگاری است) —
        // این کوئری همیشه با «no such column: device_model_id» خطای ۵۰۰
        // می‌داد، یعنی حذف هر مدل دستگاهی از پنل ادمین همیشه شکست می‌خورد،
        // حتی برای مدلی که اصلاً به هیچ محصولی وصل نبود. هیچ تستی این مسیر
        // را پوشش نمی‌داد.
        //
        // ✅ Delete/Data-Integrity Audit: بررسیِ «آیا محصولی وصل است؟» و
        // خودِ delete اکنون در یک تراکنش با lockForUpdate روی خودِ مدل انجام
        // می‌شود — بدون این، بین چک و حذف یک پنجره‌ی زمانی وجود داشت که در
        // آن (نظری، ولی واقعی روی دیتابیس‌های چندنخی مثل MySQL/Postgres)
        // یک درخواست هم‌زمان می‌توانست محصولی به همین مدل وصل کند، دقیقاً
        // در همان لحظه که این متد دارد «امن» بودنِ حذف را تأیید می‌کند.
        return DB::transaction(function () use ($model) {
            DeviceModel::where('id', $model->id)->lockForUpdate()->firstOrFail();

            $hasProducts = DB::table('device_model_product')->where('device_model_id', $model->id)->exists();

            if ($hasProducts) {
                throw new BadRequestHttpException('این مدل دستگاه به یک یا چند محصول متصل است و قابل حذف نیست.');
            }

            return $model->delete();
        });
    }
}