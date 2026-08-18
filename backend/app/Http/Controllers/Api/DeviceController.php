<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceFamily;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeviceController extends Controller
{
    /**
     * ✅ Device-First Architecture فاز ۱F: لیست عمومی خانواده‌های فعالِ
     * دستگاه. تنها منبع اکوسیستم‌های دستگاه برای فرانت‌اند — افزودن
     * خانواده‌ی جدید (مثلاً Smartwatch) از ادمین، بدون هیچ تغییر کدی، اینجا
     * ظاهر می‌شود.
     */
    public function families()
    {
        $families = DeviceFamily::query()
            ->active()
            ->ordered()
            ->get(['id', 'name', 'slug', 'icon', 'sort_order'])
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'slug' => $f->slug,
                'icon' => $f->icon,
                'sort_order' => $f->sort_order,
            ]);

        return response()->json(['success' => true, 'data' => $families]);
    }

    /**
     * لیست همه برندها - نسخه Ultra-Safe با raw query
     *
     * ✅ Device-First فاز ۱G/۱M: کاسکید فعال‌بودن اکنون شاملِ
     * DeviceFamily هم می‌شود — برند متعلق به خانواده‌ی غیرفعال، در
     * مسیرهای عمومی نمایش داده نمی‌شود (family_id=null یعنی هنوز به
     * خانواده‌ای وصل نشده و طبق سازگاری قبلی نمایش داده می‌شود).
     */
    public function brands()
    {
        try {
            $brands = DB::table('device_brands')
                ->select('device_brands.id', 'device_brands.name', 'device_brands.slug', 'device_brands.family_id')
                ->where('device_brands.is_active', true)
                ->whereNull('device_brands.deleted_at') // کوئری خام: SoftDeletes خودکار اعمال نمی‌شود
                ->where(function ($q) {
                    $q->whereNull('device_brands.family_id')
                        ->orWhereIn('device_brands.family_id', function ($sub) {
                            $sub->select('id')->from('device_families')->where('is_active', true);
                        });
                })
                ->leftJoin('device_series', function ($join) {
                    $join->on('device_brands.id', '=', 'device_series.brand_id')
                        ->whereNull('device_series.deleted_at');
                })
                ->selectRaw('COUNT(device_series.id) as series_count')
                ->groupBy('device_brands.id', 'device_brands.name', 'device_brands.slug', 'device_brands.family_id')
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
     *
     * ✅ فاز ۱G/۱M: قبلاً فعال‌بودن خودِ برند اصلاً چک نمی‌شد — یعنی سری‌های
     * یک برند غیرفعال (یا برند متعلق به خانواده‌ی غیرفعال) هم‌چنان از این
     * endpoint عمومی قابل‌دسترس بودند. الان کل زنجیره چک می‌شود.
     */
    public function series($brandId)
    {
        try {
            $brand = DB::table('device_brands')
                ->where('id', $brandId)
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->whereNull('family_id')
                        ->orWhereIn('family_id', function ($sub) {
                            $sub->select('id')->from('device_families')->where('is_active', true);
                        });
                })
                ->first();

            if (!$brand) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $series = DB::table('device_series')
                ->select('device_series.id', 'device_series.name', 'device_series.slug')
                ->where('device_series.brand_id', $brandId)
                ->where('device_series.is_active', true)
                ->whereNull('device_series.deleted_at')
                ->leftJoin('device_models', function ($join) {
                    $join->on('device_series.id', '=', 'device_models.series_id')
                        ->where('device_models.is_active', true)
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
     *
     * ✅ فاز ۱G/۱M: زنجیره‌ی کامل سری→برند→خانواده باید فعال باشد؛ قبلاً
     * فقط is_active خودِ مدل چک می‌شد.
     */
    public function models($seriesId)
    {
        try {
            $series = DB::table('device_series')
                ->join('device_brands', function ($join) {
                    $join->on('device_series.brand_id', '=', 'device_brands.id')
                        ->where('device_brands.is_active', true)
                        ->whereNull('device_brands.deleted_at');
                })
                ->where('device_series.id', $seriesId)
                ->where('device_series.is_active', true)
                ->whereNull('device_series.deleted_at')
                ->where(function ($q) {
                    $q->whereNull('device_brands.family_id')
                        ->orWhereIn('device_brands.family_id', function ($sub) {
                            $sub->select('id')->from('device_families')->where('is_active', true);
                        });
                })
                ->first();

            if (!$series) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $models = DB::table('device_models')
                ->where('series_id', $seriesId)
                ->where('is_active', true)
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
     *
     * ✅ فاز ۱G/۱M: زنجیره‌ی کامل مدل→سری→برند→خانواده باید فعال باشد؛
     * قبلاً هیچ چک فعال‌بودنی روی این endpoint وجود نداشت — یعنی درخواست
     * مستقیم به /devices/models/{id} می‌توانست یک مدلِ غیرفعال را دور بزند.
     */
    public function model($modelId)
    {
        try {
            // device_models برخلاف phone_models برند را مستقیم ندارد — فقط
            // series_id دارد؛ برند از طریق device_series به دست می‌آید.
            // screen_size/weight هم ستون‌های واقعی این جدول نیستند.
            $model = DB::table('device_models')
                ->where('device_models.id', $modelId)
                ->where('device_models.is_active', true)
                ->whereNull('device_models.deleted_at')
                ->join('device_series', function ($join) {
                    $join->on('device_models.series_id', '=', 'device_series.id')
                        ->where('device_series.is_active', true)
                        ->whereNull('device_series.deleted_at');
                })
                ->join('device_brands', function ($join) {
                    $join->on('device_series.brand_id', '=', 'device_brands.id')
                        ->where('device_brands.is_active', true)
                        ->whereNull('device_brands.deleted_at');
                })
                ->where(function ($q) {
                    $q->whereNull('device_brands.family_id')
                        ->orWhereIn('device_brands.family_id', function ($sub) {
                            $sub->select('id')->from('device_families')->where('is_active', true);
                        });
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
     *
     * ✅ فاز ۱M: فقط مدل‌های فعال، متعلق به سری/برند فعال.
     */
    public function getHierarchy()
    {
        $models = \App\Models\DeviceModel::query()
            ->where('is_active', true)
            ->whereHas('series', function ($q) {
                $q->where('is_active', true)->whereHas('brand', function ($qb) {
                    $qb->where('is_active', true)
                        ->where(function ($qf) {
                            $qf->whereNull('family_id')->orWhereHas('family', fn ($f) => $f->where('is_active', true));
                        });
                });
            })
            ->with('series.brand:id,name')
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

    /**
     * ✅ فاز ۱G/۱M: سلسله‌مراتب کامل برای هدر — قبلاً هیچ فیلتر is_active ای
     * روی series/models اعمال نمی‌شد (فقط برند فعال بود، ولی سری/مدلِ
     * غیرفعالِ همان برند هم‌چنان نشان داده می‌شد). حالا کل زنجیره
     * family→brand→series→model فعال است، و family (id/name/slug) هم به
     * هر برند اضافه شده تا فرانت‌اند بتواند بدون هاردکد mobile/laptop/tablet
     * بر اساس خانواده فیلتر/گروه‌بندی کند.
     */
    public function getHeaderHierarchy()
    {
        $brands = \App\Models\DeviceBrand::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('family_id')->orWhereHas('family', fn ($f) => $f->where('is_active', true));
            })
            ->with(['family:id,name,slug,icon', 'series' => function ($q) {
                $q->where('is_active', true)->with(['models' => function ($qm) {
                    $qm->where('is_active', true)->select('id', 'name', 'slug', 'image', 'release_year', 'series_id');
                }]);
            }])
            ->select('id', 'name', 'slug', 'type', 'family_id')
            ->get()
            ->map(function ($brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    // ✅ type برای سازگاری موقت (فاز ۱D) هنوز فرستاده می‌شود؛
                    // خودِ family منبع حقیقتِ جدید است.
                    'type' => $brand->type,
                    'family' => $brand->family ? [
                        'id' => $brand->family->id,
                        'name' => $brand->family->name,
                        'slug' => $brand->family->slug,
                        'icon' => $brand->family->icon,
                    ] : null,
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
