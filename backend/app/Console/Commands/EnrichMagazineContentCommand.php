<?php

namespace App\Console\Commands;

use App\Models\MagazineArticle;
use App\Services\PersianNewsAggregatorService;
use Illuminate\Console\Command;

class EnrichMagazineContentCommand extends Command
{
    protected $signature = 'app:enrich-magazine-content';
    protected $description = 'دریافت متن کامل برای مقالات RSS که محتوای کوتاه دارند';

    public function handle(PersianNewsAggregatorService $service): int
    {
        $articles = MagazineArticle::where('content_source', 'rss')
            ->whereNotNull('source_url')
            ->get();

        $this->info("بررسی {$articles->count()} مقاله...");

        $enriched = 0;

        foreach ($articles as $article) {
            // اگر محتوا قبلاً کامل است، رد شو
            if (mb_strlen(strip_tags($article->content ?? '')) > 500) {
                continue;
            }

            $full = $service->fetchFullContent($article->source_url);

            if ($full) {
                $article->update(['content' => $full]);
                $enriched++;
                $this->info("✅ {$article->title}");
            } else {
                $this->warn("⚠️  {$article->title}");
            }

            sleep(1); // احترام به سرور منبع
        }

        $this->info("✔️  $enriched مقاله غنی‌سازی شد.");

        return Command::SUCCESS;
    }
}