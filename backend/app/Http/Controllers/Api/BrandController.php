<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            "data" => $brands,
        ]);
    }

    public function show(Brand $brand)
    {
        $brand->load(["products" => function ($query) {
            $query->active()->with("category");
        }]);

        return response()->json([
            "success" => true,
            "data" => $brand,
        ]);
    }
}
