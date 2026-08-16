<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\Store\NearbyStoreService;
use Illuminate\Http\Request;
use InvalidArgumentException;

/**
 * جستجوی عمومی «فروشگاه‌های نزدیک این محصول» (Phase 8 — بدون نیاز به
 * ورود؛ صرفاً روی فروشگاه‌های عمومیِ فعال+تأییدشده کار می‌کند، رجوع به
 * Store::scopePubliclyDiscoverable).
 */
class NearbyStoreController extends Controller
{
    public function __construct(protected NearbyStoreService $nearbyStoreService) {}

    public function index(Request $request, Product $product)
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'radius' => 'nullable|integer|min:1',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        try {
            $result = $this->nearbyStoreService->search(
                $product->id,
                (float) $validated['lat'],
                (float) $validated['lng'],
                isset($validated['radius']) ? (int) $validated['radius'] : null,
                (int) ($validated['page'] ?? 1),
                (int) ($validated['per_page'] ?? 10)
            );

            return response()->json([
                'success' => true,
                'data' => $result['stores'],
                'meta' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'per_page' => $result['per_page'],
                    'radius' => $result['radius'],
                ],
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
