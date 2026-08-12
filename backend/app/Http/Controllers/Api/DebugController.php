<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

class DebugController extends Controller
{
    /**
     * موقت: بررسی داده‌های دیتابیس
     * فقط در development قابل استفاده
     */
    public function stats()
    {
        if (!app()->environment('local')) {
            abort(403, 'Only available in local environment');
        }

        return response()->json([
            'products' => [
                'total' => Product::count(),
                'active' => Product::where('status', 'active')->count(),
                'inactive' => Product::where('status', '!=', 'active')->count(),
                'with_seller' => Product::whereNotNull('seller_id')->count(),
                'sample' => Product::first()?->only(['id', 'name', 'status', 'seller_id']),
            ],
            'sellers' => [
                'total' => User::where('role', 'seller')->count(),
                'with_shop_name' => User::where('role', 'seller')->whereNotNull('shop_name')->count(),
                'sample' => User::where('role', 'seller')->first()?->only(['id', 'name', 'shop_name', 'slug']),
            ],
            'categories' => [
                'total' => Category::count(),
                'active' => Category::where('is_active', true)->count(),
            ],
            'devices' => [
                'brands' => DeviceBrand::count(),
                'active_brands' => DeviceBrand::where('is_active', true)->count(),
                'models' => DeviceModel::count(),
                'active_models' => DeviceModel::where('is_active', true)->count(),
                'models_with_series' => DeviceModel::whereNotNull('series_id')->count(),
                'sample_model' => DeviceModel::with('series.brand')->first()?->toArray(),
            ],
            'search_tests' => [
                'products_cab_fa' => Product::where('status', 'active')->where('name', 'like', '%قاب%')->count(),
                'products_samsung' => Product::where('status', 'active')->where('name', 'like', '%سامسونگ%')->count(),
                'products_iphone' => Product::where('status', 'active')->where('name', 'like', '%آیفون%')->count(),
            ],
        ]);
    }
}