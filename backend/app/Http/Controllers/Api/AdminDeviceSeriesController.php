<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDeviceSeriesService;
use Illuminate\Http\Request;

class AdminDeviceSeriesController extends Controller
{
    public function __construct(protected AdminDeviceSeriesService $seriesService) {}

    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search'),
            'brand_id' => $request->get('brand_id'),
            'is_active' => $request->get('is_active'),
        ];

        $data = $this->seriesService->getSeries($filters, (int) $request->get('per_page', 20));
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_id' => 'required|exists:device_brands,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:device_series,slug',
            'is_active' => 'sometimes|boolean',
        ]);

        $series = $this->seriesService->createSeries($validated);
        return response()->json(['success' => true, 'message' => 'سری دستگاه ایجاد شد', 'data' => ['id' => $series->id]], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'brand_id' => 'sometimes|exists:device_brands,id',
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:device_series,slug,' . $id,
            'is_active' => 'sometimes|boolean',
        ]);

        $series = $this->seriesService->updateSeries($id, $validated);
        return response()->json(['success' => true, 'message' => 'سری دستگاه به‌روزرسانی شد', 'data' => ['id' => $series->id]]);
    }

    public function destroy(int $id)
    {
        $this->seriesService->deleteSeries($id);
        return response()->json(['success' => true, 'message' => 'سری دستگاه حذف شد']);
    }
    
    // اندپوینت کمکی برای پر کردن Dropdown برندها در فرانت‌اند
    public function getBrandsForDropdown()
    {
        $brands = $this->seriesService->getBrandsList();
        return response()->json(['success' => true, 'data' => $brands]);
    }
}