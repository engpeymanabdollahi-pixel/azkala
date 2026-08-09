<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Magazine\StoreMagazineArticleRequest;
use App\Http\Requests\Magazine\UpdateMagazineArticleRequest;
use App\Http\Resources\MagazineResource;
use App\Http\Resources\MagazineSummaryResource;
use App\Models\MagazineArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * AdminMagazineController - مدیریت مجله ازکالا (فقط ادمین)
 * 
 * همه endpoints نیاز به middleware 'admin' دارند
 */
class AdminMagazineController extends Controller
{
    /**
     * لیست همه مقالات (شامل unpublished)
     * 
     * GET /api/v1/admin/magazine
     * 
     * Query params:
     * - per_page: تعداد در صفحه (default: 20, max: 100)
     * - status: all, published, unpublished
     * - category: فیلتر دسته‌بندی
     * - content_source: admin, rss, ai_generated
     * - search: جستجو در عنوان و خلاصه
     * - sort: latest, oldest, most_viewed, title
     */
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 20), 100);
        
        $query = MagazineArticle::query()
            ->with(['author', 'devices'])
            ->withCount('devices');

        // فیلتر وضعیت انتشار
        $status = $request->get('status', 'all');
        if ($status === 'published') {
            $query->published();
        } elseif ($status === 'unpublished') {
            $query->where('is_published', false)
                  ->orWhere('published_at', '>', now());
        }

        // فیلتر دسته‌بندی
        if ($category = $request->get('category')) {
            $query->category($category);
        }

        // فیلتر منبع محتوا
        if ($source = $request->get('content_source')) {
            $query->where('content_source', $source);
        }

        // جستجو
        if ($search = $request->get('search')) {
            $query->search($search);
        }

        // مرتب‌سازی
        $sort = $request->get('sort', 'latest');
        match ($sort) {
            'oldest' => $query->orderBy('published_at', 'asc'),
            'most_viewed' => $query->orderBy('view_count', 'desc'),
            'title' => $query->orderBy('title', 'asc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $articles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => MagazineSummaryResource::collection($articles->items()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    /**
     * ایجاد مقاله جدید
     * 
     * POST /api/v1/admin/magazine
     */
    public function store(StoreMagazineArticleRequest $request)
    {
        try {
            $validated = $request->validated();

            // استخراج devices برای sync بعد از ایجاد
            $devices = $validated['devices'] ?? [];
            unset($validated['devices']);

            // افزودن author_id
            $validated['author_id'] = $request->user()->id;

            $article = MagazineArticle::create($validated);

            // ارتباط با دستگاه‌ها
            if (!empty($devices)) {
                $deviceData = [];
                foreach ($devices as $device) {
                    $deviceData[$device['device_id']] = [
                        'relevance_score' => $device['relevance_score'] ?? 100,
                    ];
                }
                $article->devices()->attach($deviceData);
            }

            $article->load(['author', 'devices.series.brand']);

            Log::info('Magazine article created', [
                'article_id' => $article->id,
                'title' => $article->title,
                'author_id' => $article->author_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'مقاله با موفقیت ایجاد شد',
                'data' => new MagazineResource($article),
            ], 201);

        } catch (\Exception $e) {
            Log::error('AdminMagazineController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ایجاد مقاله: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * جزئیات مقاله (برای ویرایش)
     * 
     * GET /api/v1/admin/magazine/{article}
     */
    public function show(MagazineArticle $article)
    {
        $article->load(['author', 'devices.series.brand']);

        return response()->json([
            'success' => true,
            'data' => new MagazineResource($article),
        ]);
    }

    /**
     * ویرایش مقاله
     * 
     * PUT /api/v1/admin/magazine/{article}
     */
    public function update(UpdateMagazineArticleRequest $request, MagazineArticle $article)
    {
        try {
            $validated = $request->validated();

            // استخراج devices برای sync
            $devices = $validated['devices'] ?? null;
            unset($validated['devices']);

            $article->update($validated);

            // sync دستگاه‌ها اگر ارسال شده باشند
            if ($devices !== null) {
                $deviceData = [];
                foreach ($devices as $device) {
                    $deviceData[$device['device_id']] = [
                        'relevance_score' => $device['relevance_score'] ?? 100,
                    ];
                }
                $article->devices()->sync($deviceData);
            }

            $article->load(['author', 'devices.series.brand']);

            Log::info('Magazine article updated', [
                'article_id' => $article->id,
                'title' => $article->title,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'مقاله با موفقیت به‌روزرسانی شد',
                'data' => new MagazineResource($article),
            ]);

        } catch (\Exception $e) {
            Log::error('AdminMagazineController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در به‌روزرسانی مقاله: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * حذف مقاله (soft delete)
     * 
     * DELETE /api/v1/admin/magazine/{article}
     */
    public function destroy(MagazineArticle $article)
    {
        try {
            $title = $article->title;
            $article->delete();

            Log::info('Magazine article deleted', [
                'article_id' => $article->id,
                'title' => $title,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'مقاله با موفقیت حذف شد',
            ]);

        } catch (\Exception $e) {
            Log::error('AdminMagazineController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف مقاله',
            ], 500);
        }
    }

    /**
     * انتشار/غیرانتشار سریع
     * 
     * POST /api/v1/admin/magazine/{article}/toggle
     */
    public function toggle(MagazineArticle $article)
    {
        $article->update(['is_published' => !$article->is_published]);

        return response()->json([
            'success' => true,
            'message' => $article->is_published ? 'مقاله منتشر شد' : 'مقاله غیرمنتشر شد',
            'data' => [
                'is_published' => $article->is_published,
            ],
        ]);
    }

    /**
     * عملیات گروهی
     * 
     * POST /api/v1/admin/magazine/bulk-action
     * 
     * Body:
     * {
     *   "action": "publish" | "unpublish" | "delete",
     *   "ids": [1, 2, 3]
     * }
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|in:publish,unpublish,delete',
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'integer|exists:magazine_articles,id',
        ], [
            'action.required' => 'نوع عملیات الزامی است',
            'action.in' => 'نوع عملیات نامعتبر است',
            'ids.required' => 'حداقل یک مقاله باید انتخاب شود',
            'ids.max' => 'حداکثر ۱۰۰ مقاله می‌تواند انتخاب شود',
        ]);

        $action = $validated['action'];
        $ids = $validated['ids'];

        $affected = MagazineArticle::whereIn('id', $ids)->get();

        switch ($action) {
            case 'publish':
                $affected->each(fn ($a) => $a->update(['is_published' => true]));
                $message = count($ids) . ' مقاله منتشر شد';
                break;

            case 'unpublish':
                $affected->each(fn ($a) => $a->update(['is_published' => false]));
                $message = count($ids) . ' مقاله غیرمنتشر شد';
                break;

            case 'delete':
                MagazineArticle::whereIn('id', $ids)->delete();
                $message = count($ids) . ' مقاله حذف شد';
                break;
        }

        Log::info('Magazine bulk action', [
            'action' => $action,
            'count' => count($ids),
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'affected_count' => count($ids),
            ],
        ]);
    }

    /**
     * آمار برای Dashboard ادمین
     * 
     * GET /api/v1/admin/magazine/stats
     */
    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total' => MagazineArticle::count(),
                'published' => MagazineArticle::published()->count(),
                'unpublished' => MagazineArticle::count() - MagazineArticle::published()->count(),
                'by_source' => [
                    'admin' => MagazineArticle::where('content_source', 'admin')->count(),
                    'rss' => MagazineArticle::where('content_source', 'rss')->count(),
                    'ai' => MagazineArticle::where('content_source', 'ai_generated')->count(),
                ],
                'by_category' => [
                    'news' => MagazineArticle::category('news')->count(),
                    'review' => MagazineArticle::category('review')->count(),
                    'comparison' => MagazineArticle::category('comparison')->count(),
                    'guide' => MagazineArticle::category('guide')->count(),
                    'rumor' => MagazineArticle::category('rumor')->count(),
                ],
                'total_views' => MagazineArticle::sum('view_count'),
                'most_viewed' => MagazineArticle::mostViewed()
                    ->select('id', 'title', 'slug', 'view_count')
                    ->first(),
                'latest_article' => MagazineArticle::latest('id')
                    ->select('id', 'title', 'slug', 'created_at')
                    ->first(),
            ],
        ]);
    }
}