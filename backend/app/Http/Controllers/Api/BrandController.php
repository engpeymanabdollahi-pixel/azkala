<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::active()
            ->withCount("products")
            ->orderBy("name")
            ->get();

        return response()->json([
            "success" => true,
            "data" => BrandResource::collection($brands),
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