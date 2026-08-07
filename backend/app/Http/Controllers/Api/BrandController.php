<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Support\Facades\Cache;

class BrandController extends Controller
{
    public function index()
    {
        // کش‌گذاری لیست برندها برای ۱ ساعت
        return response()->json([
            "success" => true,
            "data" => Cache::remember('brands_active', 3600, function () {
                return BrandResource::collection(
                    Brand::active()
                        ->withCount("products")
                        ->orderBy("name")
                        ->get()
                );
            }),
        ]);
    }

    /**
     * برند بر اساس slug — قرینه‌ی /products/slug/{slug}.
     *
     * brand.service.ts از قبل این مسیر را صدا می‌زد ولی هیچ روتی برایش وجود
     * نداشت، پس همیشه ۴۰۴ می‌گرفت. فقط برندهای فعال، مثل show().
     */
    public function bySlug(string $slug)
    {
        $brand = Brand::active()->where('slug', $slug)->firstOrFail();

        return $this->show($brand);
    }

    public function show(Brand $brand)
    {
        $brand->load(["products" => function ($query) {
            $query->active()->with("category");
        }]);

        return response()->json([
            "success" => true,
            "data" => new BrandResource($brand),
        ]);
    }
}