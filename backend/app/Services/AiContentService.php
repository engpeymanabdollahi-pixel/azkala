<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiContentService
{
    private bool $mockMode;
    private string $model;
    private ?string $apiKey;

    public function __construct()
    {
        $this->mockMode = env('AI_MOCK_MODE', true);
        $this->model = env('OPENAI_MODEL', 'gpt-4o-mini');
        $this->apiKey = env('OPENAI_API_KEY');
    }

    /**
     * تولید مقاله کامل از topic
     */
    public function generateArticle(string $topic, string $category = 'news'): array
    {
        // اگر mock mode فعال است یا API key نداریم، از mock استفاده کن
        if ($this->mockMode || empty($this->apiKey)) {
            return $this->mockGenerateArticle($topic, $category);
        }

        $prompt = $this->buildGeneratePrompt($topic, $category);

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $this->getSystemPrompt()],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 2000,
                ]);

            if (!$response->successful()) {
                Log::error('OpenAI API failed', ['status' => $response->status(), 'body' => $response->body()]);
                return $this->mockGenerateArticle($topic, $category);
            }

            $content = $response->json('choices.0.message.content');
            return $this->parseAiResponse($content);

        } catch (\Exception $e) {
            Log::error('AI generate failed: ' . $e->getMessage());
            return $this->mockGenerateArticle($topic, $category);
        }
    }

    /**
     * بازنویسی مقاله با سبک ازکالا
     */
    public function rewriteArticle(string $content): array
    {
        if ($this->mockMode || empty($this->apiKey)) {
            return $this->mockRewriteArticle($content);
        }

        $prompt = "این مقاله را با سبک حرفه‌ای و جذاب بازنویسی کن. فقط HTML برگردان:\n\n{$content}";

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $this->getSystemPrompt()],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.6,
                    'max_tokens' => 2000,
                ]);

            if (!$response->successful()) {
                return $this->mockRewriteArticle($content);
            }

            return [
                'content' => $response->json('choices.0.message.content'),
                'is_rewritten' => true,
            ];

        } catch (\Exception $e) {
            Log::error('AI rewrite failed: ' . $e->getMessage());
            return $this->mockRewriteArticle($content);
        }
    }

    /**
     * پیشنهاد title از content
     */
    public function suggestTitle(string $content): array
    {
        if ($this->mockMode || empty($this->apiKey)) {
            return $this->mockSuggestTitle($content);
        }

        $prompt = "برای این محتوا ۳ عنوان جذاب و سئو-فرندلی پیشنهاد بده. هر عنوان در یک خط:\n\n" . mb_substr(strip_tags($content), 0, 500);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'فقط عنوان‌ها را برگردان، هر کدام در یک خط، بدون شماره.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.8,
                    'max_tokens' => 200,
                ]);

            if (!$response->successful()) {
                return $this->mockSuggestTitle($content);
            }

            $titles = array_filter(explode("\n", $response->json('choices.0.message.content')));
            return [
                'titles' => array_slice(array_values($titles), 0, 3),
            ];

        } catch (\Exception $e) {
            Log::error('AI suggest title failed: ' . $e->getMessage());
            return $this->mockSuggestTitle($content);
        }
    }

    // ==================== Private Methods ====================

    private function getSystemPrompt(): string
    {
        return <<<EOT
تو یک نویسنده حرفه‌ای محتوای فناوری برای مجله ازکالا هستی.
ویژگی‌های نوشتاری تو:
- زبان فارسی روان و حرفه‌ای
- سبک ژورنالیستی فناوری
- استفاده از اصطلاحات تخصصی به‌جا
- ساختار منظم با پاراگراف‌های کوتاه
- لحن جذاب و informativ

قالب خروجی (JSON):
{
  "title": "عنوان مقاله",
  "excerpt": "خلاصه ۲-۳ جمله‌ای",
  "content": "<p>محتوای HTML با تگ‌های p, h2, h3, strong, em, ul, ol</p>",
  "suggested_category": "news|review|comparison|guide|rumor"
}

فقط JSON برگردان، بدون هیچ متن اضافی و بدون markdown code blocks.
EOT;
    }

    private function buildGeneratePrompt(string $topic, string $category): string
    {
        return "یک مقاله کامل و جامع درباره «{$topic}» بنویس.\nدسته‌بندی پیشنهادی: {$category}\nطول: حداقل ۵۰۰ کلمه.\nاز تگ‌های HTML برای ساختار استفاده کن.";
    }

    private function parseAiResponse(string $content): array
    {
        $content = trim($content);
        
        // حذف markdown code blocks
        if (str_starts_with($content, '```json')) {
            $content = preg_replace('/^```json\s*|\s*```$/', '', $content);
        } elseif (str_starts_with($content, '```')) {
            $content = preg_replace('/^```\s*|\s*```$/', '', $content);
        }

        try {
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($data['title'])) {
                return [
                    'title' => $data['title'] ?? 'بدون عنوان',
                    'excerpt' => $data['excerpt'] ?? '',
                    'content' => $data['content'] ?? '',
                    'suggested_category' => $data['suggested_category'] ?? 'news',
                ];
            }
        } catch (\Exception $e) {
            Log::warning('AI response parse failed', ['content' => mb_substr($content, 0, 200)]);
        }

        // Fallback: استفاده از content خام
        return [
            'title' => 'مقاله تولید شده با AI',
            'excerpt' => mb_substr(strip_tags($content), 0, 150) . '...',
            'content' => '<p>' . nl2br(e($content)) . '</p>',
            'suggested_category' => 'news',
        ];
    }

    // ==================== Mock Methods ====================

       private function mockGenerateArticle(string $topic, string $category): array
    {
        $categoryLabels = [
            'news' => 'اخبار',
            'review' => 'بررسی',
            'comparison' => 'مقایسه',
            'guide' => 'راهنما',
            'rumor' => 'شایعات',
        ];

        // جلوگیری از تکرار کلمات کلیدی در title و excerpt
        $topicWords = ['بررسی', 'مقایسه', 'راهنما', 'بررسى'];
        $cleanTopic = $topic;
        foreach ($topicWords as $word) {
            if (mb_strpos($topic, $word) === 0) {
                $cleanTopic = trim(mb_substr($topic, mb_strlen($word)));
                break;
            }
        }

        return [
            'title' => "بررسی جامع {$cleanTopic}: آنچه باید بدانید",
            'excerpt' => "در این مقاله به بررسی کامل {$cleanTopic} می‌پردازیم و نکات مهمی را که باید بدانید مرور می‌کنیم. با مجله ازکالا همراه باشید.",
            'content' => <<<HTML
<h2>مقدمه</h2>
<p>{$cleanTopic} یکی از موضوعات داغ دنیای فناوری است که توجه بسیاری از علاقه‌مندان را به خود جلب کرده است. در این مقاله قصد داریم نگاهی جامع به این موضوع بیندازیم و تمام جنبه‌های مهم آن را بررسی کنیم.</p>

<h2>ویژگی‌های کلیدی</h2>
<p>برخی از مهم‌ترین ویژگی‌های {$cleanTopic} عبارتند از:</p>
<ul>
<li><strong>عملکرد بالا:</strong> این محصول از نظر سرعت و کارایی در سطح بسیار خوبی قرار دارد و می‌تواند نیازهای کاربران حرفه‌ای را برآورده کند.</li>
<li><strong>طراحی مدرن:</strong> طراحی زیبا و ارگونومیک از نقاط قوت آن است که تجربه کاربری لذت‌بخشی را فراهم می‌کند.</li>
<li><strong>قیمت مناسب:</strong> با توجه به امکانات ارائه شده، قیمت رقابتی دارد و ارزش خرید بالایی ارائه می‌دهد.</li>
<li><strong>پشتیبانی قوی:</strong> خدمات پس از فروش و پشتیبانی فنی از دیگر مزایای این محصول است.</li>
</ul>

<h2>عملکرد در دنیای واقعی</h2>
<p>در تست‌های انجام شده، {$cleanTopic} عملکرد قابل توجهی از خود نشان داده است. در شرایط استفاده روزمره، سرعت و پایداری آن کاملاً رضایت‌بخش بوده و هیچ مشکل خاصی مشاهده نشده است.</p>

<p>نقاط قوت این محصول در مقایسه با رقبا کاملاً مشهود است و می‌تواند گزینه مناسبی برای کاربرانی باشد که به دنبال کیفیت و عملکرد هستند.</p>

<h2>نتیجه‌گیری</h2>
<p>در مجموع، {$cleanTopic} گزینه‌ای قابل توجه برای علاقه‌مندان به فناوری است. اگر به دنبال محصولی با کیفیت بالا و قیمت مناسب هستید، این محصول ارزش بررسی دقیق را دارد.</p>

<p><em>این مقاله به‌صورت خودکار با هوش مصنوعی تولید شده است (Mock Mode). در صورت فعال‌سازی API Key، محتوای واقعی‌تری تولید خواهد شد.</em></p>
HTML,
            'suggested_category' => $category,
            'mock' => true,
        ];
    }

    private function mockRewriteArticle(string $content): array
    {
        return [
            'content' => '<div class="ai-rewritten"><p><strong>[بازنویسی شده با هوش مصنوعی]</strong></p>' . $content . '<p><em>این محتوا با هوش مصنوعی بازنویسی شده است (Mock Mode).</em></p></div>',
            'is_rewritten' => true,
            'mock' => true,
        ];
    }

    private function mockSuggestTitle(string $content): array
    {
        $excerpt = mb_substr(strip_tags($content), 0, 40);
        return [
            'titles' => [
                "بررسی کامل: {$excerpt}...",
                "همه چیز درباره {$excerpt}",
                "راهنمای جامع {$excerpt}",
            ],
            'mock' => true,
        ];
    }
}