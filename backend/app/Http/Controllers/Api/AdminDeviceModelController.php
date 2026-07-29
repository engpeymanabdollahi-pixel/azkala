<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDeviceModelService;
use Illuminate\Http\Request;

class AdminDeviceModelController extends Controller
{
    public function __construct(protected AdminDeviceModelService $modelService) {}

    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search'),
            'series_id' => $request->get('series_id'),
            'brand_id' => $request->get('brand_id'),
            'is_active' => $request->get('is_active'),
        ];

        $data = $this->modelService->getModels($filters, (int) $request->get('per_page', 20));
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'series_id' => 'required|exists:device_series,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:device_models,slug',
            'release_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 5),
            'is_active' => 'sometimes|boolean',
        ]);

        $model = $this->modelService->createModel($validated);
        return response()->json(['success' => true, 'message' => 'مدل دستگاه ایجاد شد', 'data' => ['id' => $model->id]], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'series_id' => 'sometimes|exists:device_series,id',
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:device_models,slug,' . $id,
            'release_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 5),
            'is_active' => 'sometimes|boolean',
        ]);

        $model = $this->modelService->updateModel($id, $validated);
        return response()->json(['success' => true, 'message' => 'مدل دستگاه به‌روزرسانی شد', 'data' => ['id' => $model->id]]);
    }

    public function destroy(int $id)
    {
        $this->modelService->deleteModel($id);
        return response()->json(['success' => true, 'message' => 'مدل دستگاه حذف شد']);
    }
    
    public function getSeriesForDropdown(Request $request)
    {
        $brandId = $request->get('brand_id') ? (int) $request->get('brand_id') : null;
        $series = $this->modelService->getSeriesList($brandId);
        return response()->json(['success' => true, 'data' => $series]);
    }
}