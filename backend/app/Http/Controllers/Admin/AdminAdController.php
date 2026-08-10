<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAdController extends Controller
{
    /**
     * لیست همه تبلیغات (برای ادمین)
     */
    public function index(Request $request)
    {
        $query = Ad::query();

        if ($request->filled('position')) {
            $query->where('position', $request->position);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $sortBy = $request->input('sort_by', 'priority');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $ads = $query->paginate(min((int) $request->input('per_page', 20), 100));

        return response()->json([
            'success' => true,
            'data' => $ads->items(),
            'meta' => [
                'current_page' => $ads->currentPage(),
                'last_page' => $ads->lastPage(),
                'per_page' => $ads->perPage(),
                'total' => $ads->total(),
            ],
        ]);
    }

    /**
     * ساخت تبلیغ جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'image_url' => 'required|url|max:1000',
            'link_url' => 'required|url|max:1000',
            'position' => ['required', Rule::in(['sidebar', 'between_articles', 'footer'])],
            'is_active' => 'boolean',
            'priority' => 'integer|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        $ad = Ad::create($validated);

        return response()->json([
            'success' => true,
            'data' => $ad,
            'message' => 'تبلیغ با موفقیت ایجاد شد',
        ], 201);
    }

    /**
     * جزئیات تبلیغ
     */
    public function show(Ad $ad)
    {
        return response()->json([
            'success' => true,
            'data' => $ad,
        ]);
    }

    /**
     * ویرایش تبلیغ
     */
    public function update(Request $request, Ad $ad)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'image_url' => 'sometimes|required|url|max:1000',
            'link_url' => 'sometimes|required|url|max:1000',
            'position' => ['sometimes', 'required', Rule::in(['sidebar', 'between_articles', 'footer'])],
            'is_active' => 'boolean',
            'priority' => 'integer|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        $ad->update($validated);

        return response()->json([
            'success' => true,
            'data' => $ad->fresh(),
            'message' => 'تبلیغ با موفقیت ویرایش شد',
        ]);
    }

    /**
     * حذف تبلیغ
     */
    public function destroy(Ad $ad)
    {
        $title = $ad->title;
        $ad->delete();

        return response()->json([
            'success' => true,
            'message' => "تبلیغ «{$title}» حذف شد",
        ]);
    }

    /**
     * Toggle وضعیت فعال/غیرفعال
     */
    public function toggle(Ad $ad)
    {
        $ad->update(['is_active' => !$ad->is_active]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ad->id,
                'is_active' => $ad->is_active,
            ],
            'message' => $ad->is_active ? 'تبلیغ فعال شد' : 'تبلیغ غیرفعال شد',
        ]);
    }
}