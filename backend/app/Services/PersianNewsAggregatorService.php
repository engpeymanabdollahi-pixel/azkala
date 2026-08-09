<?php

namespace App\Services;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\MagazineArticle;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimplePie\SimplePie;

/**
 * PersianNewsAggregatorService - جمع‌آوری اخبار فارسی از منابع مختلف
 * 
 * منابع:
 * ۱. RSS Feeds (رایگان، بدون API key)
 *    - زومیت
 *    - دیجیاتو
 *    - موبایل دات آی آر
 *    - مهر (مجله فناوری)
 *    - ایسنا (فناوری)
 * 
 * ۲. NewsData.io API (در صورت داشتن API key)
 *    - جستجو با زبان فارسی
 * 
 * ۳. Admin Override (دستی توسط ادمین)
 *    - اولویت بالاتر از همه منابع
 * 
 * معماری:
 * - هر source یک method جداگانه دارد
 * - همه به یک فرمت مشترک تبدیل می‌شوند
 * - Deduplication با slug
 * - Matching با device_models بر اساس keyword
 */
class PersianNewsAggregatorService
{
    /**
     * لیست RSS feeds
     */
    private const RSS_FEEDS = [
        'zoomit' => [
            'url' => 'https://www.zoomit.ir/feed',
            'name' => 'زومیت',
            'language' => 'fa',
        ],
        'digiato' => [
            'url' => 'https://digiato.com/feed',
            'name' => 'دیجیاتو',
            'language' => 'fa',
        ],
        'mobile' => [
            'url' => 'https://mobile.ir/news/rss.aspx',
            'name' => 'موبایل',
            'language' => 'fa',
        ],
        'mehr_tech' => [
            'url' => 'https://www.mehrnews.com/rss/pl/387',
            'name' => 'مهر - فناوری',
            'language' => 'fa',
        ],
        'isna_tech' => [
            'url' => 'https://www.isna.ir/rss/tp/41',
            'name' => 'ایسنا - فناوری',
            'language' => 'fa',
        ],
    ];

    /**
     * جمع‌آوری از همه منابع
     * 
     * @return array آمار جمع‌آوری
     */
    public function fetchAll(): array
    {
        $stats = [
            'total_fetched' => 0,
            'total_saved' => 0,
            'total_skipped' => 0,
            'errors' => [],
            'by_source' => [],
        ];

        // ۱. جمع‌آوری از RSS feeds
        foreach (self::RSS_FEEDS as $key => $feed) {
            try {
                $result = $this->fetchFromRss($feed['url'], $feed['name']);
                $stats['by_source'][$key] = $result;
                $stats['total_fetched'] += $result['fetched'];
                $stats['total_saved'] += $result['saved'];
                $stats['total_skipped'] += $result['skipped'];
            } catch (\Exception $e) {
                Log::error("Failed to fetch RSS: {$feed['name']}", [
                    'error' => $e->getMessage(),
                ]);
                $stats['errors'][] = "{$feed['name']}: {$e->getMessage()}";
            }
        }

        // ۲. جمع‌آوری از NewsData.io (اگر API key تنظیم شده باشد)
        if (config('services.newsdata.api_key')) {
            try {
                $result = $this->fetchFromNewsData();
                $stats['by_source']['newsdata'] = $result;
                $stats['total_fetched'] += $result['fetched'];
                $stats['total_saved'] += $result['saved'];
                $stats['total_skipped'] += $result['skipped'];
            } catch (\Exception $e) {
                Log::error('Failed to fetch from NewsData.io', [
                    'error' => $e->getMessage(),
                ]);
                $stats['errors'][] = "NewsData.io: {$e->getMessage()}";
            }
        }

        Log::info('PersianNewsAggregatorService: fetchAll completed', $stats);

        return $stats;
    }

    /**
     * جمع‌آوری از یک RSS feed خاص
     */
    public function fetchFromRss(string $url, string $sourceName): array
    {
        $feed = new SimplePie();
        $feed->set_feed_url($url);
        
        // تلاش برای استفاده از storage، در صورت عدم دسترسی از temp dir استفاده کن
        $cacheDir = storage_path('app/rss_cache');
        if (!is_dir($cacheDir) || !is_writable($cacheDir)) {
            $cacheDir = sys_get_temp_dir() . '/azkala_rss_cache';
            if (!is_dir($cacheDir)) {
                @mkdir($cacheDir, 0755, true);
            }
        }
        
        $feed->set_cache_location($cacheDir);
        $feed->set_cache_duration(3600); // ۱ ساعت cache
        $feed->init();
        $feed->handle_content_type();

        $items = $feed->get_items(0, 50); // حداکثر ۵۰ آیتم

        $stats = [
            'source' => $sourceName,
            'fetched' => 0,
            'saved' => 0,
            'skipped' => 0,
        ];

        // بررسی معتبر بودن items (در صورت خطای network/DNS)
        if (!$items || !is_iterable($items)) {
            Log::warning("RSS feed returned no items: {$sourceName} - {$url}");
            return $stats;
        }

        foreach ($items as $item) {
            $stats['fetched']++;

            $title = trim($item->get_title());
            $link = trim($item->get_permalink());
            $content = $item->get_content();
            $excerpt = $item->get_description();
            $publishedAt = $item->get_date('Y-m-d H:i:s');

            if (empty($title) || empty($link)) {
                $stats['skipped']++;
                continue;
            }

            // تولید slug یکتا
            $slug = MagazineArticle::generateSlug($title);

            // بررسی تکراری بودن
            if (MagazineArticle::where('slug', $slug)->exists() ||
                MagazineArticle::where('source_url', $link)->exists()) {
                $stats['skipped']++;
                continue;
            }

            // استخراج تصویر (اگر وجود داشته باشد)
            $image = $this->extractImageFromRssItem($item);

            // تطبیق با دستگاه‌ها
            $matchedDevices = $this->matchWithDevices($title, $content);

            // پاکسازی محتوا
            $cleanContent = $this->cleanRssContent($content ?? '');

            // ✨ اگر محتوا کوتاه است، متن کامل را از صفحه منبع استخراج کن
            if (mb_strlen(strip_tags($cleanContent)) < 400 && $link) {
                $fullContent = $this->fetchFullContent($link);
                if ($fullContent) {
                    $cleanContent = $fullContent;
                }
            }

            // ذخیره مقاله
            $article = MagazineArticle::create([
                'slug' => $slug,
                'title' => $title,
                'excerpt' => Str::limit(strip_tags($excerpt), 300),
                'content' => $cleanContent,
                'featured_image' => $image,
                'source_url' => $link,
                'source_name' => $sourceName,
                'category' => $this->guessCategory($title, $content),
                'language' => 'fa',
                'published_at' => $publishedAt,
                'is_published' => true,
                'content_source' => 'rss',
            ]);

            // ارتباط با دستگاه‌های matched
            if (!empty($matchedDevices)) {
                $deviceData = [];
                foreach ($matchedDevices as $deviceId => $score) {
                    $deviceData[$deviceId] = ['relevance_score' => $score];
                }
                $article->devices()->attach($deviceData);
            }

            $stats['saved']++;
        }

        return $stats;
    }

    /**
     * جمع‌آوری از NewsData.io API
     */
    public function fetchFromNewsData(): array
    {
        $apiKey = config('services.newsdata.api_key');

        if (!$apiKey) {
            return ['fetched' => 0, 'saved' => 0, 'skipped' => 0];
        }

        $response = Http::timeout(30)->get('https://newsdata.io/api/1/latest', [
            'apikey' => $apiKey,
            'language' => 'fa',
            'country' => 'ir',
            'category' => 'technology',
            'size' => 20,
        ]);

        if (!$response->successful()) {
            throw new \Exception("NewsData.io API error: {$response->status()}");
        }

        $data = $response->json();
        $articles = $data['results'] ?? [];

        $stats = [
            'source' => 'NewsData.io',
            'fetched' => count($articles),
            'saved' => 0,
            'skipped' => 0,
        ];

        foreach ($articles as $article) {
            $title = $article['title'] ?? '';
            $link = $article['link'] ?? '';
            $description = $article['description'] ?? '';
            $content = $article['content'] ?? $description;
            $image = $article['image_url'] ?? null;
            $publishedAt = $article['pubDate'] ?? now()->toDateTimeString();

            if (empty($title) || empty($link)) {
                $stats['skipped']++;
                continue;
            }

            $slug = MagazineArticle::generateSlug($title);

            if (MagazineArticle::where('slug', $slug)->exists() ||
                MagazineArticle::where('source_url', $link)->exists()) {
                $stats['skipped']++;
                continue;
            }

            $matchedDevices = $this->matchWithDevices($title, $content);

            $magazineArticle = MagazineArticle::create([
                'slug' => $slug,
                'title' => $title,
                'excerpt' => Str::limit(strip_tags($description), 300),
                'content' => $this->cleanHtml($content),
                'featured_image' => $image,
                'source_url' => $link,
                'source_name' => $article['source_id'] ?? 'NewsData.io',
                'category' => $this->guessCategory($title, $content),
                'language' => 'fa',
                'published_at' => $publishedAt,
                'is_published' => true,
                'content_source' => 'rss',
            ]);

            if (!empty($matchedDevices)) {
                $deviceData = [];
                foreach ($matchedDevices as $deviceId => $score) {
                    $deviceData[$deviceId] = ['relevance_score' => $score];
                }
                $magazineArticle->devices()->attach($deviceData);
            }

            $stats['saved']++;
        }

        return $stats;
    }

       /**
     * تطبیق مقاله با دستگاه‌ها بر اساس keyword matching
     * 
     * @return array [device_id => relevance_score]
     */
    private function matchWithDevices(string $title, string $content): array
    {
        $matchedDevices = [];
        $text = mb_strtolower($title . ' ' . $content);

        // گرفتن همه device_models با brand و series
        $devices = DeviceModel::with('series.brand')->get();

        // بهترین match: device با طولانی‌ترین نام matched
        $bestMatchDeviceId = null;
        $bestMatchNameLength = 0;
        $bestMatchScore = 0;

        foreach ($devices as $device) {
            $brandName = mb_strtolower($device->series?->brand?->name ?? '');
            $modelName = mb_strtolower($device->name);
            $seriesName = mb_strtolower($device->series?->name ?? '');
            
            // نام کامل: برند + مدل
            $fullName = $brandName && $modelName ? "$brandName $modelName" : $modelName;

            // تولید نام‌های جایگزین برای matching
            $alternativeNames = $this->getAlternativeNames($device, $brandName, $modelName, $seriesName, $fullName);

            $score = 0;
            $matchedNameLength = 0;

            // بررسی هر نام جایگزین
            foreach ($alternativeNames as $altName) {
                if (mb_strlen($altName) < 4) continue;
                
                if (str_contains($text, $altName)) {
                    $altLength = mb_strlen($altName);
                    
                    if ($altLength > $matchedNameLength) {
                        $matchedNameLength = $altLength;
                        $score = 100; // Match کامل
                    }
                }
            }

            // اگر match کامل نبود، brand + series را چک کن
            if ($score === 0 && $brandName && $seriesName && 
                mb_strlen($brandName) > 2 && mb_strlen($seriesName) > 2) {
                if (str_contains($text, $brandName) && str_contains($text, $seriesName)) {
                    $score = 60; // Match متوسط (brand + series)
                    $matchedNameLength = mb_strlen($brandName) + mb_strlen($seriesName);
                }
            }
            
            // ✨ اگر هنوز match نبود، فقط brand را چک کن
            // این برای مقالاتی است که فقط درباره برند صحبت می‌کنند
            // مثال: "پایان کار ۱۹ دستگاه سامسونگ"
            if ($score === 0 && $brandName && mb_strlen($brandName) > 2) {
                if (str_contains($text, $brandName)) {
                    $score = 40; // Match ضعیف (brand-only)
                    $matchedNameLength = mb_strlen($brandName);
                }
            }
            
            // ✨✨ اگر هنوز match نبود، فقط series را چک کن
            // این برای مقالاتی است که فقط نام سری را دارند
            // مثال: "آیفون ۱۸ پرو مکس" (آیفون = series، مدل ۱۸ در DB نیست)
            // مثال: "گلکسی زد فولد ۸" (گلکسی = series، مدل زد فولد در DB نیست)
            if ($score === 0 && $seriesName && mb_strlen($seriesName) > 2) {
                if (str_contains($text, $seriesName)) {
                    $score = 50; // Match متوسط (series-only)
                    $matchedNameLength = mb_strlen($seriesName);
                }
            }

            if ($score > 0) {
                $matchedDevices[$device->id] = [
                    'score' => $score,
                    'name' => $device->name,
                    'matched_length' => $matchedNameLength,
                ];
                
                // Track best match (longest matched name)
                if ($matchedNameLength > $bestMatchNameLength) {
                    $bestMatchNameLength = $matchedNameLength;
                    $bestMatchDeviceId = $device->id;
                    $bestMatchScore = $score;
                }
            }
        }

        // فیلتر: فقط دستگاه‌های با بهترین match یا نزدیک به آن
        $filteredDevices = [];
        
        foreach ($matchedDevices as $deviceId => $data) {
            $deviceNameLength = mb_strlen($data['name']);
            
            // ۱. حذف device هایی که نام‌شان substring از بهترین match است
            // مثال: وقتی "آیفون ۱۵ پرو مکس" match شده، "آیفون ۱۵" حذف شود
            // فقط وقتی best match قوی است (score >= 90)
            if ($bestMatchDeviceId && $deviceId !== $bestMatchDeviceId && $bestMatchScore >= 90) {
                $bestDeviceName = mb_strtolower($matchedDevices[$bestMatchDeviceId]['name']);
                $thisDeviceName = mb_strtolower($data['name']);
                
                if ($deviceNameLength < $bestMatchNameLength && 
                    str_contains($bestDeviceName, $thisDeviceName)) {
                    continue;
                }
            }
            
            // ۲. فقط device هایی با score مناسب را نگه دار
            if ($data['score'] >= 90) {
                // Match قوی: همیشه نگه دار
                $filteredDevices[$deviceId] = $data['score'];
            } elseif ($data['score'] >= 60 && $bestMatchScore < 90) {
                // Match متوسط (brand+series): فقط وقتی match قوی نیست
                $filteredDevices[$deviceId] = $data['score'];
            } elseif ($data['score'] >= 50 && $bestMatchScore < 60) {
                // ✨✨ Match سری (series-only): فقط وقتی match قوی‌تری نیست
                // این باعث می‌شود مقالات مربوط به سری‌های آینده به همه دستگاه‌های سری متصل شوند
                $filteredDevices[$deviceId] = $data['score'];
            } elseif ($data['score'] >= 40 && $bestMatchScore < 50) {
                // Match ضعیف (brand-only): فقط وقتی هیچ match قوی‌تری نیست
                $filteredDevices[$deviceId] = $data['score'];
            }
        }

        return $filteredDevices;
    }

        /**
     * تبدیل نام فارسی به انگلیسی (برای matching)
     */
    private function toEnglish(string $persianName): string
    {
        $mapping = [
            // برندها
            'آیفون' => 'iphone',
            'گلکسی' => 'galaxy',
            'پیکسل' => 'pixel',
            'شیائومی' => 'xiaomi',
            'سامسونگ' => 'samsung',
            'اپل' => 'apple',
            'هواوی' => 'huawei',
            'وان پلاس' => 'oneplus',
            'وان‌پلاس' => 'oneplus',
            'آنر' => 'honor',
            'ریلمی' => 'realme',
            'اوپو' => 'oppo',
            'ویوو' => 'vivo',
            'نوکیا' => 'nokia',
            'ال جی' => 'lg',
            'ال‌جی' => 'lg',
            'سونی' => 'sony',
            
            // مدل‌ها (فارسی به انگلیسی)
            'پرو' => 'pro',
            'مکس' => 'max',
            'اولترا' => 'ultra',
            'پلاس' => 'plus',
            'مینی' => 'mini',
            'لایت' => 'lite',
            
            // اعداد فارسی به انگلیسی
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ];

        $english = $persianName;
        foreach ($mapping as $fa => $en) {
            $english = str_replace($fa, $en, $english);
        }

        // حذف فاصله‌های اضافی
        $english = preg_replace('/\s+/', ' ', trim($english));

        return $english;
    }

    /**
     * حدس دسته‌بندی بر اساس عنوان و محتوا
     */
    private function guessCategory(string $title, string $content): string
    {
        $text = mb_strtolower($title . ' ' . $content);

        // بررسی‌ها (اولویت بالا چون کلمات خاصی دارند)
        $reviewKeywords = ['بررسی', 'ریویو', 'تست', 'آنباکس', 'جعبه‌گشایی', 'hands on', 'review', 'unboxing'];
        foreach ($reviewKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return 'review';
            }
        }

        // مقایسه
        $comparisonKeywords = ['مقایسه', 'در برابر', 'vs', 'versus', 'برتری'];
        foreach ($comparisonKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return 'comparison';
            }
        }

        // شایعات (قبل از guide چک شود چون "راهنمای خرید" هم guide است هم ممکن است شایعه داشته باشد)
        $rumorKeywords = ['شایعه', 'شایعات', 'افشا', 'لو رفت', 'درز کرد', 'leak', 'rumor', 'شایعه‌'];
        foreach ($rumorKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return 'rumor';
            }
        }

        // راهنما
        $guideKeywords = ['راهنما', 'آموزش', 'چگونه', 'نحوه', 'ترفند', 'نکات', 'guide', 'tutorial', 'how to', 'tips'];
        foreach ($guideKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return 'guide';
            }
        }

        return 'news'; // پیش‌فرض
    }

    /**
     * استخراج تصویر از RSS item
     */
    private function extractImageFromRssItem($item): ?string
    {
        try {
            // تلاش برای گرفتن media:content
            $enclosures = $item->get_enclosures();
            
            // null check
            if ($enclosures && is_iterable($enclosures)) {
                foreach ($enclosures as $enclosure) {
                    if ($enclosure && method_exists($enclosure, 'get_type')) {
                        $type = $enclosure->get_type();
                        if ($type && str_starts_with($type, 'image/')) {
                            return $enclosure->get_link();
                        }
                    }
                }
            }

            // تلاش برای استخراج از content با regex
            $content = $item->get_content();
            if ($content && preg_match('/<img[^>]+src="([^"]+)"/', $content, $matches)) {
                return $matches[1];
            }
        } catch (\Exception $e) {
            Log::debug('extractImageFromRssItem error: ' . $e->getMessage());
        }

        return null;
    }
        /**
     * دریافت متن کامل مقاله از صفحه منبع
     * 
     * فیدهای RSS معمولاً فقط خلاصه می‌دهند.
     * این متد صفحه اصلی را fetch کرده و پاراگراف‌های اصلی را استخراج می‌کند.
     */
    public function fetchFullContent(string $url): ?string
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ])
                ->get($url);

            if (!$response->successful()) {
                return null;
            }

            $html = $response->body();

            // حذف بخش‌های مزاحم
            $html = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $html);
            $html = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $html);
            $html = preg_replace('#<nav\b[^>]*>.*?</nav>#is', '', $html);
            $html = preg_replace('#<aside\b[^>]*>.*?</aside>#is', '', $html);
            $html = preg_replace('#<footer\b[^>]*>.*?</footer>#is', '', $html);
            $html = preg_replace('#<!--.*?-->#s', '', $html);

            $doc = new \DOMDocument();
            libxml_use_internal_errors(true);
            $doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
            libxml_clear_errors();

            // استخراج پاراگراف‌های اصلی (متن بلند = محتوای واقعی)
            $paragraphs = $doc->getElementsByTagName('p');
            $content = '';

            foreach ($paragraphs as $p) {
                $text = trim($p->textContent);

                if (mb_strlen($text) > 60) {
                    $content .= '<p>' . htmlspecialchars($text, ENT_QUOTES, 'UTF-8') . '</p>';
                }

                // حفظ تصاویر داخل پاراگراف
                foreach ($p->childNodes as $child) {
                    if ($child->nodeType === XML_ELEMENT_NODE && $child->nodeName === 'img') {
                        $src = $child->getAttribute('src');
                        if ($src && str_starts_with($src, 'http')) {
                            $content .= '<img src="' . $src . '" alt="" style="border-radius:12px;margin:16px auto;max-width:100%;" />';
                        }
                    }
                }
            }

            // فقط اگر متن کافی استخراج شد برگردان
            return mb_strlen(strip_tags($content)) > 500 ? $content : null;

        } catch (\Exception $e) {
            Log::debug('fetchFullContent failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * پاکسازی محتوای RSS
     */
    private function cleanRssContent(string $content): string
    {
        // حذف script و style
        $content = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $content);
        $content = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $content);

        // حذف iframe
        $content = preg_replace('#<iframe\b[^>]*>.*?</iframe>#is', '', $content);

        return trim($content);
    }

    /**
     * پاکسازی HTML عمومی
     */
    private function cleanHtml(string $html): string
    {
        return $this->cleanRssContent($html);
    }
        /**
     * ترجمه کلمه به کلمه فارسی به انگلیسی
     * 
     * مثال: "گلکسی S24 اولترا" → "گلکسی s24 ultra"
     * (فقط کلماتی که در mapping هستند translate می‌شوند)
     */
    private function toEnglishWordByWord(string $persianName): string
    {
        $wordMapping = [
            // برندها
            'آیفون' => 'iphone',
            'گلکسی' => 'galaxy',
            'پیکسل' => 'pixel',
            'شیائومی' => 'xiaomi',
            'سامسونگ' => 'samsung',
            'اپل' => 'apple',
            'هواوی' => 'huawei',
            'آنر' => 'honor',
            'ریلمی' => 'realme',
            'اوپو' => 'oppo',
            'ویوو' => 'vivo',
            'نوکیا' => 'nokia',
            'سونی' => 'sony',
            
            // مدل‌ها
            'پرو' => 'pro',
            'مکس' => 'max',
            'اولترا' => 'ultra',
            'پلاس' => 'plus',
            'مینی' => 'mini',
            'لایت' => 'lite',
            
            // اعداد فارسی
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ];

        // تقسیم به کلمات (با حفظ فاصله)
        $words = preg_split('/(\s+)/', $persianName, -1, PREG_SPLIT_DELIM_CAPTURE);
        $translated = [];
        
        foreach ($words as $word) {
            // اگر whitespace بود، همان را نگه دار
            if (trim($word) === '') {
                $translated[] = $word;
                continue;
            }
            
            // اگر کلمه در mapping است، translate کن
            if (isset($wordMapping[$word])) {
                $translated[] = $wordMapping[$word];
            } else {
                // بررسی اعداد فارسی در کلمه
                $wordWithNumbers = strtr($word, array_intersect_key($wordMapping, array_flip(['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'])));
                $translated[] = $wordWithNumbers;
            }
        }
        
        return implode('', $translated);
    }
        /**
     * تولید همه ترکیب‌های ممکن فارسی/انگلیسی برای یک نام
     * 
     * مثال برای "گلکسی S24 اولترا":
     * - "گلکسی s24 اولترا" (همه فارسی)
     * - "galaxy s24 اولترا" (mixed)
     * - "گلکسی s24 ultra" (mixed) ← این را می‌خواهیم!
     * - "galaxy s24 ultra" (همه انگلیسی)
     */
    private function generateMixedVariants(string $name): array
    {
        $wordMapping = $this->getWordMapping();
        
        // تقسیم به کلمات (با حفظ فاصله‌ها)
        $words = preg_split('/(\s+)/', $name, -1, PREG_SPLIT_DELIM_CAPTURE);
        
        // پیدا کردن index کلمات قابل ترجمه
        $translatableIndices = [];
        foreach ($words as $i => $word) {
            if (trim($word) === '') continue;
            if (isset($wordMapping[$word])) {
                $translatableIndices[] = $i;
            }
        }
        
        // اگر هیچ کلمه قابل ترجمه‌ای نیست، فقط خود نام را برگردان
        if (empty($translatableIndices)) {
            return [$name];
        }
        
        // محدودیت: حداکثر ۵ کلمه قابل ترجمه (۲^۵ = ۳۲ ترکیب)
        $count = min(count($translatableIndices), 5);
        
        $variants = [];
        
        // تولید همه ترکیب‌ها با bitmask
        for ($mask = 0; $mask < (1 << $count); $mask++) {
            $wordsCopy = $words;
            
            for ($j = 0; $j < $count; $j++) {
                // اگر بیت j فعال است، کلمه را به انگلیسی ترجمه کن
                if ($mask & (1 << $j)) {
                    $idx = $translatableIndices[$j];
                    $wordsCopy[$idx] = $wordMapping[$words[$idx]];
                }
            }
            
            $variant = implode('', $wordsCopy);
            $variants[] = $variant;
        }
        
        return array_values(array_unique($variants));
    }
             /**
     * تبدیل اعداد فارسی به انگلیسی در یک رشته
     * 
     * مثال: 'آیفون ۱۵ پرو' → 'آیفون 15 پرو'
     */
    private function convertPersianNumbers(string $text): string
    {
        $persian = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
        $english = ['0','1','2','3','4','5','6','7','8','9'];
        return str_replace($persian, $english, $text);
    }

    /**
     * mapping کلمات فارسی به انگلیسی (مشترک بین متدها)
     */
    private function getWordMapping(): array
    {
        return [
            // برندها
            'آیفون' => 'iphone',
            'گلکسی' => 'galaxy',
            'پیکسل' => 'pixel',
            'شیائومی' => 'xiaomi',
            'سامسونگ' => 'samsung',
            'اپل' => 'apple',
            'هواوی' => 'huawei',
            'آنر' => 'honor',
            'ریلمی' => 'realme',
            'اوپو' => 'oppo',
            'ویوو' => 'vivo',
            'نوکیا' => 'nokia',
            'سونی' => 'sony',
            
            // مدل‌ها
            'پرو' => 'pro',
            'مکس' => 'max',
            'اولترا' => 'ultra',
            'پلاس' => 'plus',
            'مینی' => 'mini',
            'لایت' => 'lite',
            
            // اعداد فارسی
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ];
    }
        /**
     * تولید نام‌های جایگزین برای یک دستگاه (برای matching بهتر)
     * 
     * مثال برای "گلکسی S24 اولترا":
     * - "گلکسی s24 اولترا"
     * - "گلکسی s24 ultra"
     * - "galaxy s24 ultra"
     * - "s24 ultra"
     * - "گلکسی s24"
     */
        /**
     * تولید نام‌های جایگزین برای یک دستگاه (برای matching بهتر)
     * 
     * مثال برای "گلکسی S24 اولترا":
     * - "گلکسی s24 اولترا" (فارسی کامل)
     * - "glaxy s24 ultra" (انگلیسی کامل)
     * - "گلکسی s24 ultra" (mixed: برند فارسی + مدل انگلیسی)
     * - "galaxy s24 اولترا" (mixed: برند انگلیسی + مدل فارسی)
     * - "s24 ultra" (فقط مدل انگلیسی)
     */
    private function getAlternativeNames(
        DeviceModel $device,
        string $brandName,
        string $modelName,
        string $seriesName,
        string $fullName
    ): array {
        $names = [];
        
        // نام‌های انگلیسی برای ترکیب
        $englishBrand = $brandName ? mb_strtolower($this->toEnglish($brandName)) : '';
        $englishModel = $modelName ? mb_strtolower($this->toEnglish($modelName)) : '';
        $englishSeries = $seriesName ? mb_strtolower($this->toEnglish($seriesName)) : '';
        
        // ۱. نام کامل فارسی (برند + مدل)
        if ($fullName) {
            $names[] = mb_strtolower($fullName);
        }
        
        // ۲. نام کامل انگلیسی
        if ($englishBrand && $englishModel) {
            $names[] = "$englishBrand $englishModel";
        } elseif ($englishModel) {
            $names[] = $englishModel;
        }
        
        // ۳. ترکیب mixed: برند فارسی + مدل انگلیسی
        // مثال: "گلکسی s24 ultra" (وقتی متن این شکلی نوشته شده)
        if ($brandName && $englishModel) {
            $names[] = mb_strtolower($brandName) . ' ' . $englishModel;
        }
        
        // ۴. ترکیب mixed: برند انگلیسی + مدل فارسی
        if ($englishBrand && $modelName && $englishBrand !== mb_strtolower($brandName)) {
            $names[] = $englishBrand . ' ' . mb_strtolower($modelName);
        }
        
        // ۵. مدل با همه ترکیب‌های mixed (فارسی/انگلیسی)
        if ($modelName) {
            // نسخه با اعداد فارسی (مثلاً "آیفون ۱۵ پرو")
            $mixedVariants = $this->generateMixedVariants($modelName);
            foreach ($mixedVariants as $variant) {
                $names[] = mb_strtolower($variant);
            }
            
            // نسخه با اعداد انگلیسی (مثلاً "آیفون 15 پرو")
            $modelNameEnglishNumbers = $this->convertPersianNumbers($modelName);
            if ($modelNameEnglishNumbers !== $modelName) {
                $mixedVariantsEn = $this->generateMixedVariants($modelNameEnglishNumbers);
                foreach ($mixedVariantsEn as $variant) {
                    $names[] = mb_strtolower($variant);
                }
            }
        }
        
        // ۶. ترکیب برند + سری (برای match کمتر دقیق)
        if ($brandName && $seriesName) {
            $names[] = mb_strtolower("$brandName $seriesName");
            if ($englishBrand && $englishSeries) {
                $names[] = "$englishBrand $englishSeries";
            }
        }
        
        // حذف duplicates و نام‌های خالی/خیلی کوتاه
        $names = array_unique(array_filter($names, function ($n) {
            $trimmed = trim($n);
            return mb_strlen($trimmed) > 3;
        }));
        
        return array_values($names);
    }
}