<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeviceController extends Controller
{
    /**
     * لیست همه برندها - نسخه Ultra-Safe با raw query
     */
    public function brands()
    {
        try {
            // Raw query بدون هیچ وابستگی به Model
            $brands = DB::table('brands')
                ->select('brands.id', 'brands.name', 'brands.slug')
                ->where('brands.is_active', true)
                ->leftJoin('phone_series', 'brands.id', '=', 'phone_series.brand_id')
                ->selectRaw('COUNT(phone_series.id) as series_count')
                ->groupBy('brands.id', 'brands.name', 'brands.slug')
                ->havingRaw('COUNT(phone_series.id) > 0')
                ->orderBy('brands.name')
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
            $series = DB::table('phone_series')
                ->select('phone_series.id', 'phone_series.name', 'phone_series.slug', 'phone_series.image')
                ->where('phone_series.brand_id', $brandId)
                ->where('phone_series.is_active', true)
                ->leftJoin('phone_models', 'phone_series.id', '=', 'phone_models.series_id')
                ->selectRaw('COUNT(phone_models.id) as models_count')
                ->groupBy('phone_series.id', 'phone_series.name', 'phone_series.slug', 'phone_series.image')
                ->orderBy('phone_series.name')
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => (int) $s->id,
                        'name' => $s->name,
                        'slug' => $s->slug,
                        'image' => $s->image,
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
            $models = DB::table('phone_models')
                ->where('series_id', $seriesId)
                ->where('is_active', true)
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
            $model = DB::table('phone_models')
                ->where('phone_models.id', $modelId)
                ->join('brands', 'phone_models.brand_id', '=', 'brands.id')
                ->leftJoin('phone_series', 'phone_models.series_id', '=', 'phone_series.id')
                ->select(
                    'phone_models.*',
                    'brands.name as brand_name',
                    'brands.slug as brand_slug',
                    'phone_series.name as series_name',
                    'phone_series.slug as series_slug'
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
                    'screen_size' => $model->screen_size,
                    'weight' => $model->weight,
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
        $brands = \App\Models\DeviceBrand::with('series.models:id,name,series_id')
            ->select('id', 'name', 'slug', 'type') // ✅ اضافه شدن 'type'
            ->where('is_active', true)
            ->get()
            ->map(function ($brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'type' => $brand->type, // ✅ ارسال type به فرانت‌اند
                    'series' => $brand->series->map(function ($series) {
                        return [
                            'id' => $series->id,
                            'name' => $series->name,
                            'models' => $series->models->map(fn($m) => [
                                'id' => $m->id,
                                'name' => $m->name,
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