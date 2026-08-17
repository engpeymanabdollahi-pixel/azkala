<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MagazineArticle;

/**
 * 📰 وارد کردن مقالات مجله از فایل export دیتابیس (backend/database/seeders/data/magazine_articles.json).
 *
 * ایدم‌پوتنت: با updateOrCreate بر اساس slug — اجرای مجدد داده تکراری نمی‌سازد.
 * رکوردهای soft-delete شده (deleted_at) وارد نمی‌شوند.
 */
class MagazineArticleSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📰 در حال وارد کردن مقالات مجله...');

        $file = database_path('seeders/data/magazine_articles.json');

        if (! file_exists($file)) {
            $this->command->warn('فایل magazine_articles.json پیدا نشد — این سیدر اسکیپ شد.');
            return;
        }

        $articles = json_decode(file_get_contents($file), true);

        if (! is_array($articles)) {
            $this->command->warn('محتوای فایل JSON نامعتبر است.');
            return;
        }

        $imported = 0;
        $skippedDeleted = 0;

        foreach ($articles as $article) {
            if (! empty($article['deleted_at'])) {
                $skippedDeleted++;
                continue;
            }

            MagazineArticle::updateOrCreate(
                ['slug' => $article['slug']],
                [
                    'title' => $article['title'] ?? '',
                    'excerpt' => $article['excerpt'] ?? null,
                    'content' => $article['content'] ?? '',
                    'featured_image' => $article['featured_image'] ?? null,
                    'source_url' => $article['source_url'] ?? null,
                    'source_name' => $article['source_name'] ?? null,
                    'author_id' => $article['author_id'] ?? null,
                    'category' => $article['category'] ?? MagazineArticle::CATEGORY_NEWS,
                    'language' => $article['language'] ?? 'fa',
                    'view_count' => (int) ($article['view_count'] ?? 0),
                    'published_at' => $article['published_at'] ?? now(),
                    'is_published' => (bool) ($article['is_published'] ?? false),
                    'content_source' => $article['content_source'] ?? MagazineArticle::SOURCE_RSS,
                    'is_ai_rewritten' => (bool) ($article['is_ai_rewritten'] ?? false),
                    'ai_rewrite_prompt' => $article['ai_rewrite_prompt'] ?? null,
                    'created_at' => $article['created_at'] ?? now(),
                    'updated_at' => $article['updated_at'] ?? now(),
                ]
            );

            $imported++;
        }

        $message = "✅ {$imported} مقاله وارد شد.";
        if ($skippedDeleted > 0) {
            $message .= " ({$skippedDeleted} رکورد حذف‌شده اسکیپ شد)";
        }
        $this->command->info($message);
    }
}
