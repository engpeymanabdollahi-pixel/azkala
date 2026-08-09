<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MagazineResource;
use App\Http\Resources\MagazineSummaryResource;
use App\Models\MagazineArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * MagazineController - Public endpoints برای مجله ازکالا
 * 
 * همه این endpoints نیاز به authentication ندارند (public)
 * فقط مقالات published برگردانده می‌شوند
 */
class MagazineController extends Controller
{
    /**
     * لیست مقالات با pagination
     * 
     * GET /api/v1/magazine
     * 
     * Query params:
     * - per_page: تعداد مقالات در صفحه (default: 12, max: 50)
     * - page: شماره صفحه
     * - category: فیلتر دسته‌بندی (news, review, comparison, guide, rumor)
     * - search: جستجو در عنوان و خلاصه
     */
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 12), 50);
        $category = $request->get('category');
        $search = $request->get('search');

        $query = MagazineArticle::published()
            ->latestPublished()
            ->with(['devices.series.brand', 'author']);

        if ($category) {
            $query->category($category);
        }

        if ($search) {
            $query->search($search);
        }

        $articles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => MagazineSummaryResource::collection($articles->items()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
                'from' => $articles->firstItem(),
                'to' => $articles->lastItem(),
            ],
        ]);
    }

    /**
     * جزئیات کامل یک مقاله + افزایش view_count
     * 
     * GET /api/v1/magazine/{slug}
     * 
     * - فقط یکبار در ۱ ساعت برای هر IP view_count افزایش می‌یابد
     * - محتوای کامل در response برگردانده می‌شود
     * - مقالات مرتبط (از همان دستگاه‌ها) نیز برگردانده می‌شوند
     */
    public function show(Request $request, string $slug)
    {
        $article = MagazineArticle::published()
            ->where('slug', $slug)
            ->with(['devices.series.brand', 'author'])
            ->first();

        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'مقاله یافت نشد',
            ], 404);
        }

        // افزایش view_count با rate limit بر اساس IP
        $this->incrementViewCount($request, $article);

        // مقالات مرتبط (از همان دستگاه‌ها)
        $relatedArticles = $this->getRelatedArticles($article, 4);

        return response()->json([
            'success' => true,
            'data' => new MagazineResource($article),
            'related' => MagazineSummaryResource::collection($relatedArticles),
        ]);
    }

    /**
     * فیلتر مقالات بر اساس دسته‌بندی
     * 
     * GET /api/v1/magazine/category/{category}
     */
    public function byCategory(Request $request, string $category)
    {
        $validCategories = [
            MagazineArticle::CATEGORY_NEWS,
            MagazineArticle::CATEGORY_REVIEW,
            MagazineArticle::CATEGORY_COMPARISON,
            MagazineArticle::CATEGORY_GUIDE,
            MagazineArticle::CATEGORY_RUMOR,
        ];

        if (!in_array($category, $validCategories)) {
            return response()->json([
                'success' => false,
                'message' => 'دسته‌بندی نامعتبر',
            ], 400);
        }

        $perPage = min((int) $request->get('per_page', 12), 50);

        $articles = MagazineArticle::published()
            ->category($category)
            ->latestPublished()
            ->with(['devices.series.brand', 'author'])
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => MagazineSummaryResource::collection($articles->items()),
            'category_label' => match($category) {
                'news' => 'اخبار',
                'review' => 'بررسی',
                'comparison' => 'مقایسه',
                'guide' => 'راهنما',
                'rumor' => 'شایعات',
            },
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    /**
     * اخبار مرتبط با یک دستگاه خاص
     * 
     * GET /api/v1/devices/{modelId}/news
     * 
     * برای استفاده در Device-Aware Home Page
     */
    public function deviceNews(Request $request, int $modelId)
    {
        $limit = min((int) $request->get('limit', 8), 20);

        $articles = MagazineArticle::published()
            ->forDevice($modelId)
            ->latestPublished()
            ->with(['devices' => function ($q) use ($modelId) {
                $q->where('device_models.id', $modelId);
            }, 'author'])
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => MagazineSummaryResource::collection($articles),
            'count' => $articles->count(),
        ]);
    }

    /**
     * مقالات ویژه برای نمایش در Hero یا Sidebar
     * 
     * GET /api/v1/magazine/featured
     * 
     * Query params:
     * - limit: تعداد (default: 5, max: 20)
     * - device_id: فیلتر برای دستگاه خاص
     */
    public function featured(Request $request)
    {
        $limit = min((int) $request->get('limit', 5), 20);
        $deviceId = $request->get('device_id');

        $query = MagazineArticle::published()
            ->orderBy('view_count', 'desc')       // اولویت اول: بیشترین بازدید
            ->orderBy('published_at', 'desc')     // tie-breaker: جدیدترین
            ->with(['devices.series.brand', 'author']);

        if ($deviceId) {
            $query->forDevice((int) $deviceId);
        }

        $articles = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data' => MagazineSummaryResource::collection($articles),
        ]);
    }

    /**
     * آمار کلی مجله
     * 
     * GET /api/v1/magazine/stats
     */
    public function stats()
    {
        // Cache برای ۱۰ دقیقه
        $stats = Cache::remember('magazine_stats', 600, function () {
            return [
                'total_articles' => MagazineArticle::published()->count(),
                'total_views' => MagazineArticle::published()->sum('view_count'),
                'by_category' => [
                    'news' => MagazineArticle::published()->category('news')->count(),
                    'review' => MagazineArticle::published()->category('review')->count(),
                    'comparison' => MagazineArticle::published()->category('comparison')->count(),
                    'guide' => MagazineArticle::published()->category('guide')->count(),
                    'rumor' => MagazineArticle::published()->category('rumor')->count(),
                ],
                'latest_article' => MagazineArticle::published()
                    ->latestPublished()
                    ->first()
                    ?->published_at
                    ?->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    // ==================== Private Helpers ====================

    /**
     * افزایش view_count با rate limit (هر IP فقط یکبار در ۱ ساعت)
     */
    private function incrementViewCount(Request $request, MagazineArticle $article): void
    {
        $ip = $request->ip();
        $cacheKey = "article_view_{$article->id}_{$ip}";

        if (!Cache::has($cacheKey)) {
            $article->incrementViewCount();
            Cache::put($cacheKey, true, 3600); // ۱ ساعت
        }
    }

    /**
     * دریافت مقالات مرتبط با مقاله فعلی
     * 
     * منطق: مقالاتی که حداقل یک دستگاه مشترک دارند
     */
    private function getRelatedArticles(MagazineArticle $article, int $limit = 4)
    {
        $deviceIds = $article->devices->pluck('id')->toArray();

        if (empty($deviceIds)) {
            // اگر دستگاهی نیست، آخرین مقالات از همان دسته
            return MagazineArticle::published()
                ->category($article->category)
                ->where('id', '!=', $article->id)
                ->latestPublished()
                ->with(['devices.series.brand', 'author'])
                ->limit($limit)
                ->get();
        }

        // مقالاتی که حداقل یک دستگاه مشترک دارند
        return MagazineArticle::published()
            ->where('id', '!=', $article->id)
            ->whereHas('devices', function ($q) use ($deviceIds) {
                $q->whereIn('device_models.id', $deviceIds);
            })
            ->with(['devices.series.brand', 'author'])
            ->latestPublished()
            ->limit($limit)
            ->get();
    }
}