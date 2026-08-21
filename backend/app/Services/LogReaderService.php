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
        /**
     * جستجوی همه لاگ‌های یک کاربر بر اساس شماره تلفن.
     *
     * @param string      $phone         شماره تلفن (مثلاً 09123456789)
     * @param string|null $dateFrom      فیلتر از تاریخ (Y-m-d)
     * @param string|null $dateTo        فیلتر تا تاریخ (Y-m-d)
     * @param string|null $eventFilter   فیلتر بر اساس event name
     * @param string|null $channelFilter فیلتر بر اساس کانال (security|payment)
     * @return array{user_id: int|null, phone_mask: string|null, entries: array}
     */
    public function searchByUser(
        string $phone,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $eventFilter = null,
        ?string $channelFilter = null
    ): array {
        // 1. Normalize کردن شماره تلفن
        $normalizedPhone = $this->normalizePhone($phone);
        if ($normalizedPhone === null) {
            return ['user_id' => null, 'phone_mask' => null, 'entries' => []];
        }

        // 2. Hash کردن شماره تلفن (همان hash که در SecurityLog استفاده می‌شود)
        $phoneHash = hash('sha256', $normalizedPhone);

        // 3. پیدا کردن user_id از DB
        $user = \App\Models\User::where('phone', $normalizedPhone)->first();
        $userId = $user?->id;

        $results = [];

        // 4. جستجو در security.log با phone_hash (اگر channelFilter اجازه دهد)
        if ($channelFilter === null || $channelFilter === 'security') {
            $securityFiles = $this->getChannelFiles('security');
            foreach ($securityFiles as $file) {
                // فیلتر تاریخ بر اساس نام فایل
                if (!$this->isFileInDateRange($file, $dateFrom, $dateTo)) {
                    continue;
                }

                $content = File::get($file);
                $lines = explode("\n", $content);

                foreach ($lines as $line) {
                    if (str_contains($line, $phoneHash)) {
                        $entry = $this->parseLogLine($line);
                        if ($entry !== null) {
                            $entry['channel'] = 'security';

                            // فیلتر تاریخ بر اساس timestamp entry
                            if (!$this->isEntryInDateRange($entry, $dateFrom, $dateTo)) {
                                continue;
                            }

                            // فیلتر event
                            if ($eventFilter !== null && ($entry['event'] ?? '') !== $eventFilter) {
                                continue;
                            }

                            $results[] = $entry;
                        }
                    }
                }
            }
        }

        // 5. جستجو در payment.log با user_id (اگر channelFilter اجازه دهد)
        if ($userId !== null && ($channelFilter === null || $channelFilter === 'payment')) {
            $paymentFiles = $this->getChannelFiles('payment');
            foreach ($paymentFiles as $file) {
                // فیلتر تاریخ بر اساس نام فایل
                if (!$this->isFileInDateRange($file, $dateFrom, $dateTo)) {
                    continue;
                }

                $content = File::get($file);
                $lines = explode("\n", $content);

                foreach ($lines as $line) {
                    // جستجو برای "user_id":123
                    if (str_contains($line, "\"user_id\":{$userId}")) {
                        $entry = $this->parseLogLine($line);
                        if ($entry !== null) {
                            $entry['channel'] = 'payment';

                            // فیلتر تاریخ بر اساس timestamp entry
                            if (!$this->isEntryInDateRange($entry, $dateFrom, $dateTo)) {
                                continue;
                            }

                            // فیلتر event
                            if ($eventFilter !== null && ($entry['event'] ?? '') !== $eventFilter) {
                                continue;
                            }

                            $results[] = $entry;
                        }
                    }
                }
            }
        }

        // 6. مرتب‌سازی بر اساس timestamp (newest first)
        usort($results, fn($a, $b) => strtotime($b['timestamp']) - strtotime($a['timestamp']));

        return [
            'user_id' => $userId,
            'phone_mask' => $this->maskPhone($normalizedPhone),
            'entries' => $results,
        ];
    }

    /**
     * جستجوی لاگ‌ها بر اساس user_id.
     */
    public function searchByUserId(int $userId): array
    {
        $results = [];

        // جستجو در payment.log
        $paymentFiles = $this->getChannelFiles('payment');
        foreach ($paymentFiles as $file) {
            $content = File::get($file);
            $lines = explode("\n", $content);

            foreach ($lines as $line) {
                if (str_contains($line, "\"user_id\":{$userId}")) {
                    $entry = $this->parseLogLine($line);
                    if ($entry !== null) {
                        $entry['channel'] = 'payment';
                        $results[] = $entry;
                    }
                }
            }
        }

        // جستجو در security.log
        $securityFiles = $this->getChannelFiles('security');
        foreach ($securityFiles as $file) {
            $content = File::get($file);
            $lines = explode("\n", $content);

            foreach ($lines as $line) {
                if (str_contains($line, "\"user_id\":{$userId}")) {
                    $entry = $this->parseLogLine($line);
                    if ($entry !== null) {
                        $entry['channel'] = 'security';
                        $results[] = $entry;
                    }
                }
            }
        }

        usort($results, fn($a, $b) => strtotime($b['timestamp']) - strtotime($a['timestamp']));

        return [
            'user_id' => $userId,
            'entries' => $results,
        ];
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
        /**
     * Normalize کردن شماره تلفن.
     * ارقام فارسی → لاتین، حذف فاصله و کاراکترهای اضافی.
     */
    private function normalizePhone(string $phone): ?string
    {
        // تبدیل ارقام فارسی به لاتین
        $persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $latinDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $phone = str_replace($persianDigits, $latinDigits, $phone);

        // حذف کاراکترهای غیر عددی (فاصله، خط تیره، پرانتز)
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // بررسی فرمت معتبر شماره ایرانی (09xxxxxxxxx)
        if (preg_match('/^09[0-9]{9}$/', $phone)) {
            return $phone;
        }

        return null;
    }

    /**
     * Mask کردن شماره تلفن برای نمایش.
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) < 7) {
            return str_repeat('*', strlen($phone));
        }

        return substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 7) . substr($phone, -3);
    }
        /**
     * بررسی اینکه آیا یک log entry در بازه تاریخ مشخص‌شده قرار دارد.
     */
    private function isEntryInDateRange(array $entry, ?string $dateFrom, ?string $dateTo): bool
    {
        if (!$dateFrom && !$dateTo) {
            return true;
        }

        $entryTimestamp = $entry['timestamp'] ?? null;
        if ($entryTimestamp === null) {
            return true; // اگر timestamp نبود، رد نکن
        }

        try {
            $entryDate = date('Y-m-d', strtotime($entryTimestamp));
        } catch (\Exception $e) {
            return true;
        }

        if ($dateFrom && $entryDate < $dateFrom) {
            return false;
        }
        if ($dateTo && $entryDate > $dateTo) {
            return false;
        }

        return true;
    }
}