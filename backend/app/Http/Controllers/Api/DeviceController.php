<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeviceController extends Controller
{
    /**
     * لیست همه برندها - نسخه Ultra-Safe با raw query
     *
     * ✅ اصلاح حیاتی: قبلاً از جدول‌های brands/phone_series می‌خواند —
     * جدول‌هایی که هیچ seeder ای هیچ‌وقت پرشان نمی‌کند (فقط device_brands/
     * device_series/device_models توسط DeviceHierarchySeeder پر می‌شوند).
     * نتیجه: این endpoint همیشه آرایه‌ی خالی برمی‌گرداند و کل ویزارد
     * «افزودن دستگاه» در داشبورد کاربر (DevicesSection.tsx) برای هر کاربر
     * واقعی همیشه یک لیست خالی از برندها نشان می‌داد — عملاً غیرقابل‌استفاده.
     * device_brands/device_series/device_models همان جدول‌هایی هستند که
     * Product::deviceModels() هم واقعاً به آن‌ها وصل است (رابطه‌ی
     * device_model_product)، پس با این اصلاح «دستگاه‌های من» به همان
     * سیستم سازگاریِ واقعیِ محصولات وصل می‌شود.
     */
    public function brands()
    {
        try {
            $brands = DB::table('device_brands')
                ->select('device_brands.id', 'device_brands.name', 'device_brands.slug')
                ->where('device_brands.is_active', true)
                ->whereNull('device_brands.deleted_at') // کوئری خام: SoftDeletes خودکار اعمال نمی‌شود
                ->leftJoin('device_series', function ($join) {
                    $join->on('device_brands.id', '=', 'device_series.brand_id')
                        ->whereNull('device_series.deleted_at');
                })
                ->selectRaw('COUNT(device_series.id) as series_count')
                ->groupBy('device_brands.id', 'device_brands.name', 'device_brands.slug')
                ->havingRaw('COUNT(device_series.id) > 0')
                ->orderBy('device_brands.name')
                ->get()
                ->map(function ($brand) {
                    return [
                        'id' => (int) $brand->id,
                        'name' => $brand->name,
                        'slug' => $brand->slug,
                        'series_count' => (int) $brand->series_count,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $brands,
            ]);
        } catch (\Exception $e) {
            Log::error('DeviceController@brands ERROR: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());

            return response()->json([
                'success' => false,
                'message' => 'خطا: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * لیست سری‌های یک برند
     */
    public function series($brandId)
    {
        try {
            $series = DB::table('device_series')
                ->select('device_series.id', 'device_series.name', 'device_series.slug')
                ->where('device_series.brand_id', $brandId)
                ->whereNull('device_series.deleted_at')
                ->leftJoin('device_models', function ($join) {
                    $join->on('device_series.id', '=', 'device_models.series_id')
                        ->whereNull('device_models.deleted_at');
                })
                ->selectRaw('COUNT(device_models.id) as models_count')
                ->groupBy('device_series.id', 'device_series.name', 'device_series.slug')
                ->orderBy('device_series.name')
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => (int) $s->id,
                        'name' => $s->name,
                        'slug' => $s->slug,
                        // device_series ستون image ندارد (فقط device_models دارد)
                        'image' => null,
                        'models_count' => (int) $s->models_count,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $series,
            ]);
        } catch (\Exception $e) {
            Log::error('DeviceController@series ERROR: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * لیست مدل‌های یک سری
     */
    public function models($seriesId)
    {
        try {
            $models = DB::table('device_models')
                ->where('series_id', $seriesId)
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'image', 'release_year'])
                ->map(function ($m) {
                    return [
                        'id' => (int) $m->id,
                        'name' => $m->name,
                        'slug' => $m->slug,
                        'image' => $m->image,
                        'release_year' => $m->release_year,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $models,
            ]);
        } catch (\Exception $e) {
            Log::error('DeviceController@models ERROR: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * اطلاعات یک مدل
     */
    public function model($modelId)
    {
        try {
            // device_models برخلاف phone_models برند را مستقیم ندارد — فقط
            // series_id دارد؛ برند از طریق device_series به دست می‌آید.
            // screen_size/weight هم ستون‌های واقعی این جدول نیستند.
            $model = DB::table('device_models')
                ->where('device_models.id', $modelId)
                ->whereNull('device_models.deleted_at')
                ->join('device_series', function ($join) {
                    $join->on('device_models.series_id', '=', 'device_series.id')
                        ->whereNull('device_series.deleted_at');
                })
                ->join('device_brands', function ($join) {
                    $join->on('device_series.brand_id', '=', 'device_brands.id')
                        ->whereNull('device_brands.deleted_at');
                })
                ->select(
                    'device_models.*',
                    'device_brands.id as brand_id',
                    'device_brands.name as brand_name',
                    'device_brands.slug as brand_slug',
                    'device_series.name as series_name',
                    'device_series.slug as series_slug'
                )
                ->first();

            if (!$model) {
                return response()->json([
                    'success' => false,
                    'message' => 'مدل یافت نشد',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (int) $model->id,
                    'name' => $model->name,
                    'slug' => $model->slug,
                    'image' => $model->image,
                    'release_year' => $model->release_year,
                    'brand' => [
                        'id' => (int) $model->brand_id,
                        'name' => $model->brand_name,
                        'slug' => $model->brand_slug,
                    ],
                    'series' => $model->series_name ? [
                        'name' => $model->series_name,
                        'slug' => $model->series_slug,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DeviceController@model ERROR: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا: ' . $e->getMessage(),
            ], 500);
        }
    }
        /**
     * دریافت سلسله‌مراتب کامل دستگاه‌ها در یک درخواست (بهینه‌شده برای فرانت‌اند)
     */
    public function getHierarchy()
    {
        $models = \App\Models\DeviceModel::with('series.brand:id,name')
            ->select('id', 'name', 'series_id')
            ->get()
            ->map(function ($model) {
                return [
                    'id' => $model->id,
                    'name' => $model->name,
                    'brand' => $model->series->brand ? [
                        'name' => $model->series->brand->name
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $models
        ]);
    }

    public function getHeaderHierarchy()
    {
        // slug و release_year و image ستون‌های واقعی device_models‌اند و توسط
        // سیدر واقعاً پر می‌شوند، ولی این پاسخ فقط id و name می‌فرستاد. نتیجه:
        // فرانت‌اند مدال هدر برای هر مدل عکس عمومی می‌ساخت و فیلد slug مدل
        // انتخابی همیشه undefined بود، با اینکه هر دو داده در دیتابیس بودند.
        $brands = \App\Models\DeviceBrand::with('series.models:id,name,slug,image,release_year,series_id')
            ->select('id', 'name', 'slug', 'type')
            ->where('is_active', true)
            ->get()
            ->map(function ($brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'type' => $brand->type,
                    'series' => $brand->series->map(function ($series) {
                        return [
                            'id' => $series->id,
                            'name' => $series->name,
                            'models' => $series->models->map(fn ($m) => [
                                'id' => $m->id,
                                'name' => $m->name,
                                'slug' => $m->slug,
                                'image' => $m->image,
                                'release_year' => $m->release_year,
                            ]),
                        ];
                    }),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $brands,
        ]);
    }
}