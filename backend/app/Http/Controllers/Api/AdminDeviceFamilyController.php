<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDeviceFamilyService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminDeviceFamilyController extends Controller
{
    public function __construct(protected AdminDeviceFamilyService $familyService) {}

    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
        ];

        $data = $this->familyService->getFamilies($filters, (int) $request->get('per_page', 50));

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function show(int $id)
    {
        $data = $this->familyService->getFamily($id);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('device_families', 'slug')],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0|max:100000',
            'is_active' => 'sometimes|boolean',
        ]);

        $family = $this->familyService->createFamily($validated);

        return response()->json([
            'success' => true,
            'message' => 'خانواده‌ی دستگاه ایجاد شد',
            'data' => ['id' => $family->id, 'name' => $family->name, 'slug' => $family->slug],
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('device_families', 'slug')->ignore($id)],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0|max:100000',
            'is_active' => 'sometimes|boolean',
        ]);

        $family = $this->familyService->updateFamily($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'خانواده‌ی دستگاه به‌روزرسانی شد',
            'data' => ['id' => $family->id, 'name' => $family->name],
        ]);
    }

    public function destroy(int $id)
    {
        $this->familyService->deleteFamily($id);

        return response()->json(['success' => true, 'message' => 'خانواده‌ی دستگاه حذف شد']);
    }
}
