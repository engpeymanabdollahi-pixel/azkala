<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBrandService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminBrandController extends Controller
{
    protected AdminBrandService $brandService;

    public function __construct(AdminBrandService $brandService)
    {
        $this->brandService = $brandService;
    }

    /**
     * ظ„غŒط³طھ ط¨ط±ظ†ط¯ظ‡ط§
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'search' => $request->get('search'),
                'is_active' => $request->filled('is_active') ? (bool) $request->is_active : null,
                'is_featured' => $request->filled('is_featured') ? (bool) $request->is_featured : null,
                'verified' => $request->filled('verified') ? (bool) $request->verified : null,
                'country' => $request->get('country'),
                'sort_by' => $request->get('sort_by', 'sort_order'),
                'sort_order' => $request->get('sort_order', 'asc'),
            ];

            $data = $this->brandService->getBrands($filters, (int) $request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminBrandController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

   

    /**
     * ط§غŒط¬ط§ط¯ ط¨ط±ظ†ط¯ ط¬ط¯غŒط¯
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
            'slug' => 'nullable|string|max:255|unique:brands,slug',
            'logo' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:255',
            'founded_year' => 'nullable|integer|min:1800|max:' . date('Y'),
            'is_featured' => 'sometimes|boolean',
            'meta_title' => 'nullable|string|max:200',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'social_media' => 'nullable',
            'gallery' => 'nullable',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $brand = $this->brandService->createBrand($validated);

            return response()->json([
                'success' => true,
                'message' => 'ط¨ط±ظ†ط¯ ط§غŒط¬ط§ط¯ ط´ط¯',
                'data' => $brand,
            ], 201);
        } catch (\Exception $e) {
            Log::error('AdminBrandController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ط¨ط±ظ†ط¯
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255|unique:brands,slug,' . $id,
            'logo' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:255',
            'founded_year' => 'nullable|integer',
            'is_featured' => 'sometimes|boolean',
            'verified_at' => 'nullable|date',
            'verification_badge' => 'nullable|in:none,gold,platinum,diamond',
            'meta_title' => 'nullable|string|max:200',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string|max:255',
            'social_media' => 'nullable',
            'gallery' => 'nullable',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $brand = $this->brandService->updateBrand((int) $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'ط¨ط±ظ†ط¯ ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ط´ط¯',
                'data' => $brand,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminBrandController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * ط­ط°ظپ ط¨ط±ظ†ط¯
     */
    public function destroy($id)
    {
        try {
            $this->brandService->deleteBrand((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'ط¨ط±ظ†ط¯ ط­ط°ظپ ط´ط¯',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * طھط£غŒغŒط¯ ط¨ط±ظ†ط¯
     */
    public function verify($id)
    {
        try {
            $this->brandService->verifyBrand((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'ط¨ط±ظ†ط¯ طھط£غŒغŒط¯ ط´ط¯',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * ظ„ط؛ظˆ طھط£غŒغŒط¯ ط¨ط±ظ†ط¯
     */
    public function unverify($id)
    {
        try {
            $this->brandService->unverifyBrand((int) $id);

            return response()->json([
                'success' => true,
                'message' => 'طھط£غŒغŒط¯غŒظ‡ ط¨ط±ظ†ط¯ ظ„ط؛ظˆ ط´ط¯',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * ط¹ظ…ظ„غŒط§طھ ع¯ط±ظˆظ‡غŒ
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:brands,id',
            'action' => 'required|in:activate,deactivate,feature,unfeature,delete',
        ]);

        try {
            $result = $this->brandService->bulkAction($validated['ids'], $validated['action']);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminBrandController@bulkAction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
    public function show(int $id)
{
    try {
        $brand = \App\Models\Brand::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'brand' => [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'country' => $brand->country,
                    'is_active' => $brand->is_active,
                    'is_verified' => $brand->is_verified,
                    'created_at' => $brand->created_at,
                    'updated_at' => $brand->updated_at,
                ]
            ]
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'برند یافت نشد'
        ], 404);
    }
}
}