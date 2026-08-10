<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MagazineResource;
use App\Http\Resources\MagazineSummaryResource;
use App\Models\MagazineArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminMagazineController extends Controller
{
    /**
     * لیست مقالات با فیلتر، جستجو و pagination
     */
    public function index(Request $request)
    {
        $query = MagazineArticle::with(['author', 'devices.series.brand']);

        // فیلتر دسته‌بندی
        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        // فیلتر منبع محتوا
        if ($source = $request->input('content_source')) {
            $query->where('content_source', $source);
        }

        // فیلتر وضعیت انتشار
        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        // فیلتر با دستگاه / بدون دستگاه
        if ($request->input('has_devices') === 'yes') {
            $query->has('devices');
        } elseif ($request->input('has_devices') === 'no') {
            $query->doesntHave('devices');
        }

        // جستجو در عنوان، خلاصه و محتوای
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // فیلتر بازه زمانی
        if ($from = $request->input('from')) {
            $query->whereDate('published_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->whereDate('published_at', '<=', $to);
        }

        // مرتب‌سازی
        $sortBy = $request->input('sort_by', 'published_at');
        $sortDir = $request->input('sort_dir', 'desc');
        
        if (in_array($sortBy, ['title', 'published_at', 'view_count', 'created_at', 'updated_at'])) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('published_at', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $articles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => MagazineResource::collection($articles),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    /**
     * ساخت مقاله دستی توسط ادمین
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'slug' => 'nullable|string|max:500|unique:magazine_articles,slug',
            'excerpt' => 'nullable|string|max:1000',
            'content' => 'nullable|string',
            'featured_image' => 'nullable|url|max:1000',
            'category' => ['required', Rule::in(['news', 'review', 'comparison', 'guide', 'rumor'])],
            'content_source' => ['required', Rule::in(['admin', 'rss', 'ai_generated'])],
            'source_name' => 'nullable|string|max:255',
            'source_url' => 'nullable|url|max:1000',
            'is_published' => 'boolean',
            'is_ai_rewritten' => 'boolean',
            'published_at' => 'nullable|date',
            'device_ids' => 'nullable|array',
            'device_ids.*' => 'exists:device_models,id',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['title']) . '-' . Str::random(6);
        
        $article = MagazineArticle::create([
            'slug' => $slug,
            'title' => $validated['title'],
            'excerpt' => $validated['excerpt'] ?? Str::limit(strip_tags($validated['content'] ?? ''), 200),
            'content' => $validated['content'] ?? '',
            'featured_image' => $validated['featured_image'] ?? null,
            'category' => $validated['category'],
            'content_source' => $validated['content_source'],
            'source_name' => $validated['source_name'] ?? 'ازکالا',
            'source_url' => $validated['source_url'] ?? null,
            'is_published' => $validated['is_published'] ?? true,
            'is_ai_rewritten' => $validated['is_ai_rewritten'] ?? false,
            'published_at' => $validated['published_at'] ?? now(),
            'view_count' => 0,
        ]);

        // اتصال دستگاه‌ها
        if (!empty($validated['device_ids'])) {
            $article->devices()->sync($validated['device_ids']);
        }

        return response()->json([
            'success' => true,
            'data' => new MagazineResource($article->load(['devices'])),
            'message' => 'مقاله با موفقیت ایجاد شد',
        ], 201);
    }

    /**
     * جزئیات کامل مقاله
     */
    public function show(MagazineArticle $article)
    {
        $article->load(['devices.series.brand', 'author']);
        
        return response()->json([
            'success' => true,
            'data' => new MagazineResource($article),
        ]);
    }

    /**
     * ویرایش مقاله
     */
    public function update(Request $request, MagazineArticle $article)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:500',
            'slug' => ['sometimes', 'nullable', 'string', 'max:500', Rule::unique('magazine_articles', 'slug')->ignore($article->id)],
            'excerpt' => 'nullable|string|max:1000',
            'content' => 'nullable|string',
            'featured_image' => 'nullable|url|max:1000',
            'category' => ['sometimes', 'required', Rule::in(['news', 'review', 'comparison', 'guide', 'rumor'])],
            'content_source' => ['sometimes', 'required', Rule::in(['admin', 'rss', 'ai_generated'])],
            'source_name' => 'nullable|string|max:255',
            'source_url' => 'nullable|url|max:1000',
            'is_published' => 'boolean',
            'is_ai_rewritten' => 'boolean',
            'published_at' => 'nullable|date',
            'device_ids' => 'nullable|array',
            'device_ids.*' => 'exists:device_models,id',
        ]);

        $article->update(array_filter($validated, fn($v) => $v !== null && $v !== 'device_ids'));

        // آپدیت دستگاه‌ها
        if (array_key_exists('device_ids', $validated)) {
            $article->devices()->sync($validated['device_ids'] ?? []);
        }

        return response()->json([
            'success' => true,
            'data' => new MagazineResource($article->fresh(['devices'])),
            'message' => 'مقاله با موفقیت ویرایش شد',
        ]);
    }

    /**
     * حذف مقاله
     */
    public function destroy(MagazineArticle $article)
    {
        $title = $article->title;
        $article->devices()->detach();
        $article->delete();

        return response()->json([
            'success' => true,
            'message' => "مقاله «{$title}» حذف شد",
        ]);
    }

    /**
     * تغییر وضعیت انتشار (toggle)
     */
    public function toggle(MagazineArticle $article)
    {
        $article->update([
            'is_published' => !$article->is_published,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $article->id,
                'is_published' => $article->is_published,
            ],
            'message' => $article->is_published ? 'منتشر شد' : 'از انتشار خارج شد',
        ]);
    }

    /**
     * عملیات گروهی (bulk actions)
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['publish', 'unpublish', 'delete'])],
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'exists:magazine_articles,id',
        ]);

        $action = $validated['action'];
        $ids = $validated['ids'];
        $affected = 0;

        switch ($action) {
            case 'publish':
                $affected = MagazineArticle::whereIn('id', $ids)
                    ->update(['is_published' => true]);
                break;
            case 'unpublish':
                $affected = MagazineArticle::whereIn('id', $ids)
                    ->update(['is_published' => false]);
                break;
            case 'delete':
                // حذف pivot ها
                DB::table('magazine_article_device')
                    ->whereIn('magazine_article_id', $ids)
                    ->delete();
                $affected = MagazineArticle::whereIn('id', $ids)->delete();
                break;
        }

        return response()->json([
            'success' => true,
            'message' => "عملیات {$action} روی {$affected} مقاله انجام شد",
            'affected' => $affected,
        ]);
    }

    /**
     * آمار کلی مجله برای داشبورد ادمین
     */
    public function stats()
    {
        $stats = [
            'total_articles' => MagazineArticle::count(),
            'published' => MagazineArticle::where('is_published', true)->count(),
            'draft' => MagazineArticle::where('is_published', false)->count(),
            'total_views' => MagazineArticle::sum('view_count'),
            'by_source' => MagazineArticle::select('content_source', DB::raw('count(*) as count'))
                ->groupBy('content_source')
                ->pluck('count', 'content_source'),
            'by_category' => MagazineArticle::select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->pluck('count', 'category'),
            'with_devices' => MagazineArticle::has('devices')->count(),
            'without_devices' => MagazineArticle::doesntHave('devices')->count(),
            'latest_article' => MagazineArticle::latest('published_at')->first()?->published_at,
            'today_count' => MagazineArticle::whereDate('created_at', today())->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}