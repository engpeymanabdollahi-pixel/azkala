<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

/**
 * Service برای خواندن و parse کردن Laravel log files.
 *
 * این service فایل‌های log (daily-rotated) را می‌خواند و هر خط را
 * به یک structured array تبدیل می‌کند. برای performance، فقط N خط
 * آخر فایل خوانده می‌شود (tail-based).
 *
 * ⚠️ READ-ONLY: این service هرگز log نمی‌نویسد، فقط می‌خواند.
 */
class LogReaderService
{
    /**
     * مسیر base برای log files.
     */
    private string $logsPath;

    public function __construct()
    {
        $this->logsPath = storage_path('logs');
    }

    /**
     * خواندن log های یک کانال خاص.
     *
     * @param string $channel نام کانال (security, payment, api, queue)
     * @param int    $limit   تعداد خط (از آخر فایل)
     * @param string|null $eventFilter فیلتر بر اساس event name
     * @return array<int, array> لیست log entries (newest first)
     */
    public function readChannel(
        string $channel,
        int $limit = 100,
        ?string $eventFilter = null,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        $files = $this->getChannelFiles($channel);
        $entries = [];

        foreach ($files as $file) {
            // بررسی date range
            if (!$this->isFileInDateRange($file, $dateFrom, $dateTo)) {
                continue;
            }

            $lines = $this->tailFile($file, $limit);

            foreach ($lines as $line) {
                $entry = $this->parseLogLine($line);
                if ($entry === null) {
                    continue;
                }

                // فیلتر بر اساس event
                if ($eventFilter && ($entry['event'] ?? '') !== $eventFilter) {
                    continue;
                }

                $entries[] = $entry;
            }

            // اگر به اندازه کافی entry داریم، متوقف شو
            if (count($entries) >= $limit) {
                break;
            }
        }

        // مرتب‌سازی بر اساس timestamp (newest first)
        usort($entries, fn($a, $b) => strtotime($b['timestamp']) - strtotime($a['timestamp']));

        return array_slice($entries, 0, $limit);
    }

    /**
     * جستجو در همه کانال‌ها بر اساس request_id.
     *
     * @param string $requestId UUID v4
     * @return array<int, array> لیست entries مربوط به آن request
     */
    public function searchByRequestId(string $requestId): array
    {
        $channels = ['security', 'payment', 'api', 'queue'];
        $results = [];

        foreach ($channels as $channel) {
            $files = $this->getChannelFiles($channel);

            foreach ($files as $file) {
                $content = File::get($file);
                $lines = explode("\n", $content);

                foreach ($lines as $line) {
                    if (str_contains($line, $requestId)) {
                        $entry = $this->parseLogLine($line);
                        if ($entry !== null) {
                            $entry['channel'] = $channel;
                            $results[] = $entry;
                        }
                    }
                }
            }
        }

        // مرتب‌سازی بر اساس timestamp
        usort($results, fn($a, $b) => strtotime($b['timestamp']) - strtotime($a['timestamp']));

        return $results;
    }

    /**
     * آمار خلاصه برای stats cards.
     */
    public function getStats(): array
    {
        $today = now()->format('Y-m-d');

        return [
            'security_today' => $this->countTodayEvents('security', $today),
            'payment_today' => $this->countTodayEvents('payment', $today),
            'failed_logins_today' => $this->countEventToday('security', $today, 'auth.login.failure'),
            'rate_limits_today' => $this->countEventToday('security', $today, 'abuse.rate_limit.hit'),
            'orders_today' => $this->countEventToday('payment', $today, 'order.created'),
        ];
    }

    /**
     * لیست event های موجود در یک کانال (برای dropdown فیلتر).
     */
    public function getAvailableEvents(string $channel): array
    {
        $files = $this->getChannelFiles($channel);
        $events = [];

        foreach ($files as $file) {
            $content = File::get($file);
            preg_match_all('/"event":"([^"]+)"/', $content, $matches);

            foreach ($matches[1] ?? [] as $event) {
                $events[$event] = true;
            }
        }

        return array_keys($events);
    }

    // ==================== Private Methods ====================

    /**
     * لیست فایل‌های log یک کانال (newest first).
     */
    private function getChannelFiles(string $channel): array
    {
        $pattern = $this->logsPath . "/{$channel}-*.log";
        $files = glob($pattern);

        // مرتب‌سازی newest first
        rsort($files);

        // اگر فایل بدون تاریخ وجود دارد (مثلاً payment.log)
        $noDateFile = $this->logsPath . "/{$channel}.log";
        if (File::exists($noDateFile)) {
            array_unshift($files, $noDateFile);
        }

        return $files;
    }

    /**
     * خواندن N خط آخر فایل (tail).
     */
    private function tailFile(string $file, int $lines): array
    {
        if (!File::exists($file)) {
            return [];
        }

        $content = File::get($file);
        $allLines = explode("\n", trim($content));

        return array_slice($allLines, -$lines);
    }

    /**
     * Parse کردن یک خط log به structured array.
     *
     * Format: [2026-08-21 06:14:34] local.INFO: event_name {"key":"value"}
     */
    private function parseLogLine(string $line): ?array
    {
        $line = trim($line);
        if (empty($line)) {
            return null;
        }

        // Regex برای parse کردن Laravel log format
        // [timestamp] environment.LEVEL: message {json_context}
        if (!preg_match(
            '/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.+?)(?: (\{.*\}))?$/s',
            $line,
            $matches
        )) {
            return null;
        }

        $entry = [
            'timestamp'   => $matches[1],
            'environment' => $matches[2],
            'level'       => $matches[3],
            'message'     => $matches[4],
        ];

        // Parse کردن JSON context اگر وجود دارد
        if (!empty($matches[5])) {
            $context = json_decode($matches[5], true);
            if (is_array($context)) {
                $entry = array_merge($entry, $context);
            }
        }

        return $entry;
    }

    /**
     * بررسی اینکه آیا فایل در بازه تاریخ مشخص‌شده قرار دارد.
     */
    private function isFileInDateRange(string $file, ?string $dateFrom, ?string $dateTo): bool
    {
        if (!$dateFrom && !$dateTo) {
            return true;
        }

        // استخراج تاریخ از نام فایل: security-2026-08-21.log
        if (preg_match('/(\d{4}-\d{2}-\d{2})/', basename($file), $matches)) {
            $fileDate = $matches[1];

            if ($dateFrom && $fileDate < $dateFrom) {
                return false;
            }
            if ($dateTo && $fileDate > $dateTo) {
                return false;
            }
        }

        return true;
    }

    /**
     * شمارش تعداد log های امروز یک کانال.
     */
    private function countTodayEvents(string $channel, string $today): int
    {
        $file = $this->logsPath . "/{$channel}-{$today}.log";
        if (!File::exists($file)) {
            return 0;
        }

        $content = File::get($file);
        $lines = explode("\n", trim($content));

        return count(array_filter($lines, fn($line) => !empty(trim($line))));
    }

    /**
     * شمارش یک event خاص در امروز.
     */
    private function countEventToday(string $channel, string $today, string $event): int
    {
        $file = $this->logsPath . "/{$channel}-{$today}.log";
        if (!File::exists($file)) {
            return 0;
        }

        $content = File::get($file);

        return substr_count($content, "\"event\":\"{$event}\"");
    }
}