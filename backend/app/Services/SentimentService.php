<?php

namespace App\Services;

use App\Models\MessageSentiment;

class SentimentService
{
    // عبارات مثبت چندکلمه‌ای (بیشترین وزن)
    private array $positivePhrases = [
        'عالی بود', 'خیلی خوب', 'خیلی عالی', 'ممنون از شما', 'مرسی از شما',
        'سپاسگزارم', 'دستت درد نکنه', 'دستتون درد نکنه', 'دمت گرم', 'دمتون گرم',
        'ایول', 'خوشحالم از خرید', 'راضی هستم', 'خیلی راضی', 'کاملاً راضی',
        'بهترین خرید', 'خرید خوبی بود', 'کیفیت عالی', 'کیفیتش خوبه',
        'ارسال سریع', 'بسته‌بندی خوب', 'قیمت مناسب', 'قیمت خوبی',
        'ارزش خرید', 'پیشنهاد می‌کنم', 'حتماً می‌خرم', 'دوباره می‌خرم',
        'مشتری شدم', 'عالیه', 'خوبه', 'ممنونم', 'مرسی', 'سپاس',
        'می‌خرم', 'میخرم', 'می‌پسندم', 'دوست دارم', 'عاشقشم',
    ];

    // عبارات منفی چندکلمه‌ای (بیشترین وزن)
    private array $negativePhrases = [
        'خیلی بد', 'افتضاح بود', 'افتضاحه', 'اصلاً خوب نیست', 'راضی نیستم',
        'ناراضی هستم', 'خیلی ناراضی', 'پشیمون شدم', 'پشیمان شدم', 'پشیمونم',
        'پولم رو پس بدید', 'پس بده', 'مرجوع می‌کنم', 'مرجوعی',
        'کیفیت بد', 'کیفیتش بده', 'خراب بود', 'خرابه', 'شکسته بود', 'شکسته',
        'معیوب بود', 'معیوبه', 'ارسال دیر', 'دیر رسید', 'خیلی دیر', 'معطل شدم',
        'کلاهبرداری', 'دروغ گفتید', 'تقلبی بود', 'فیک بود', 'فیکه',
        'دیگه نمی‌خرم', 'اصلاً نخرید', 'پشیمونی', 'خوشم نیومد', 'خوشم نمیاد',
        'بد بود', 'بده', 'بدتر از این', 'افتضاح', 'فاجعه',
    ];

    // کلمات مثبت (تکی)
    private array $positiveWords = [
        'عالی', 'خوب', 'خوبه', 'خوبی', 'ممنون', 'ممنونم', 'مرسی', 'مرسی', 'سپاس', 'تشکر',
        'خوشحالم', 'راضی', 'پسندیدم', 'دوست', 'عشق', 'محبت', 'لطف',
        'سریع', 'به‌موقع', 'مناسب', 'ارزان', 'ارزش', 'کیفیت',
        'اورجینال', 'اصل', 'واقعی', 'درست', 'صحیح', 'موفق', 'تبریک',
        'آفرین', 'احسنت', 'خوش', 'زیبا', 'قشنگ', 'جالب',
        'مفید', 'کاربردی', 'راحت', 'آسان', 'ساده', 'تمیز', 'نو',
        'جدید', 'بهترین', 'برتر', 'ممتاز', 'ویژه',
        'بله', 'حتما', 'حتماً', 'البته', 'درسته', 'موافق',
        'میخرم', 'می‌خرم', 'میپسندم', 'می‌پسندم',
    ];

    // کلمات منفی (تکی)
    private array $negativeWords = [
        'بد', 'بدی', 'بده', 'بدتر', 'افتضاح', 'فاجعه', 'لعنتی',
        'ناراحت', 'ناراضی', 'عصبانی', 'خشمگین', 'عصبی', 'کلافه',
        'دیر', 'تاخیر', 'تأخیر', 'دیرکرد', 'معطل', 'انتظار',
        'گران', 'گرون', 'گرونه', 'زیاد', 'افزایش', 'بالا',
        'خراب', 'شکسته', 'معیوب', 'خرابی', 'ایراد', 'مشکل', 'عیب',
        'تقلبی', 'فیک', 'جعلی', 'بی‌کیفیت', 'بی‌ارزش',
        'نه', 'نخیر', 'غلط', 'اشتباه', 'نادرست',
        'مرجوعی', 'پس', 'بازپس', 'شکایت', 'اعتراض',
        'کلاهبرداری', 'دزد', 'دروغ', 'فریب',
        'نمی‌خوام', 'نمی‌خواهم', 'نمیخوام', 'بسه', 'کافیه',
        'مزخرف', 'چرت', 'پرت', 'مسخره', 'احمقانه',
        'نیومد', 'نمیاد', 'نیومدم', 'نپسندیدم',
    ];

    // کلمات تقویت‌کننده
    private array $intensifiers = [
        'خیلی', 'بسیار', 'فوق‌العاده', 'واقعاً', 'کاملاً', 'شدیداً',
        'به‌شدت', 'چقدر', 'چه‌قدر', 'فوق', 'بی‌نهایت', 'خیلی‌خیلی',
    ];

    // کلمات تضعیف‌کننده
    private array $diminishers = [
        'کمی', 'اندکی', 'تا حدودی', 'تقریباً', 'نسبتاً', 'شاید',
    ];

    /**
     * تحلیل احساسات یک پیام
     */
    public function analyze(string $text, int $messageId, int $conversationId, int $userId): MessageSentiment
    {
        $result = $this->calculateScore($text);
        $sentiment = $this->determineSentiment($result['score']);

        $sentimentRecord = MessageSentiment::updateOrCreate(
            ['message_id' => $messageId],
            [
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'sentiment' => $sentiment,
                'score' => $result['score'],
                'keywords' => $result['keywords'],
            ]
        );

        return $sentimentRecord;
    }

    /**
     * محاسبه امتیاز احساس (بهبود یافته)
     */
    private function calculateScore(string $text): array
    {
        $score = 0.0;
        $keywords = [];
        $textLower = mb_strtolower($text, 'UTF-8');

        // ۱. بررسی عبارات چندکلمه‌ای مثبت (بیشترین وزن)
        foreach ($this->positivePhrases as $phrase) {
            if (mb_strpos($textLower, mb_strtolower($phrase, 'UTF-8')) !== false) {
                $score += 2.5;
                $keywords[] = ['word' => $phrase, 'type' => 'positive', 'score' => 2.5];
            }
        }

        // ۲. بررسی عبارات چندکلمه‌ای منفی (بیشترین وزن)
        foreach ($this->negativePhrases as $phrase) {
            if (mb_strpos($textLower, mb_strtolower($phrase, 'UTF-8')) !== false) {
                $score -= 2.5;
                $keywords[] = ['word' => $phrase, 'type' => 'negative', 'score' => -2.5];
            }
        }

        // ۳. بررسی علائم نگارشی
        if (preg_match('/!{2,}/u', $text)) {
            $score *= 1.3;
        }
        if (preg_match('/[؟?]{2,}/u', $text)) {
            $score -= 0.1;
        }

        // ۴. بررسی ایموجی‌ها
        if (preg_match('/[😊😀😃😄😁😆🙂🤗👍❤️💯✨🎉🌟🙏😍]/u', $text)) {
            $score += 1.5;
            $keywords[] = ['word' => '😊', 'type' => 'positive', 'score' => 1.5];
        }
        if (preg_match('/[😞😔😢😭😤😠😡👎💔🤮🤢😒]/u', $text)) {
            $score -= 1.5;
            $keywords[] = ['word' => '😞', 'type' => 'negative', 'score' => -1.5];
        }

        // ۵. بررسی کلمات تکی با substring matching
        $words = preg_split('/\s+/u', $text);
        $multiplier = 1.0;

        foreach ($words as $word) {
            $word = trim($word);
            if (empty($word)) continue;
            $wordLower = mb_strtolower($word, 'UTF-8');

            // تقویت‌کننده
            if (in_array($wordLower, $this->intensifiers) || in_array($word, $this->intensifiers)) {
                $multiplier = 2.0;
                continue;
            }

            // تضعیف‌کننده
            if (in_array($wordLower, $this->diminishers) || in_array($word, $this->diminishers)) {
                $multiplier = 0.5;
                continue;
            }

            // کلمات مثبت (تطبیق دقیق یا substring)
            $matchedPositive = false;
            foreach ($this->positiveWords as $pw) {
                if ($word === $pw || $wordLower === mb_strtolower($pw, 'UTF-8')) {
                    $wordScore = 1.0 * $multiplier;
                    $score += $wordScore;
                    $keywords[] = ['word' => $word, 'type' => 'positive', 'score' => $wordScore];
                    $matchedPositive = true;
                    break;
                }
            }
            if (!$matchedPositive) {
                // substring matching برای کلمات با پسوند
                foreach ($this->positiveWords as $pw) {
                    if (mb_strpos($wordLower, mb_strtolower($pw, 'UTF-8')) !== false && mb_strlen($pw) >= 3) {
                        $wordScore = 0.8 * $multiplier;
                        $score += $wordScore;
                        $keywords[] = ['word' => $word, 'type' => 'positive', 'score' => $wordScore];
                        break;
                    }
                }
            }

            // کلمات منفی (تطبیق دقیق یا substring)
            $matchedNegative = false;
            foreach ($this->negativeWords as $nw) {
                if ($word === $nw || $wordLower === mb_strtolower($nw, 'UTF-8')) {
                    $wordScore = -1.0 * $multiplier;
                    $score += $wordScore;
                    $keywords[] = ['word' => $word, 'type' => 'negative', 'score' => $wordScore];
                    $matchedNegative = true;
                    break;
                }
            }
            if (!$matchedNegative) {
                foreach ($this->negativeWords as $nw) {
                    if (mb_strpos($wordLower, mb_strtolower($nw, 'UTF-8')) !== false && mb_strlen($nw) >= 3) {
                        $wordScore = -0.8 * $multiplier;
                        $score += $wordScore;
                        $keywords[] = ['word' => $word, 'type' => 'negative', 'score' => $wordScore];
                        break;
                    }
                }
            }

            $multiplier = 1.0;
        }

        // ۶. نرمال‌سازی امتیاز نهایی
        $normalizedScore = max(-1.0, min(1.0, $score / 5.0));

        return [
            'score' => round($normalizedScore, 3),
            'keywords' => array_slice($keywords, 0, 10),
        ];
    }

    /**
     * تعیین احساس بر اساس امتیاز (آستانه‌های بهتر)
     */
    private function determineSentiment(float $score): string
    {
        if ($score > 0.05) return 'positive';
        if ($score < -0.05) return 'negative';
        return 'neutral';
    }

    /**
     * دریافت آمار احساسات یک مکالمه
     */
    public function getConversationStats(int $conversationId): array
    {
        $sentiments = MessageSentiment::where('conversation_id', $conversationId)->get();

        $total = $sentiments->count();
        $positive = $sentiments->where('sentiment', 'positive')->count();
        $negative = $sentiments->where('sentiment', 'negative')->count();
        $neutral = $sentiments->where('sentiment', 'neutral')->count();
        $avgScore = $total > 0 ? $sentiments->avg('score') : 0.0;

        return [
            'total' => $total,
            'positive' => $positive,
            'negative' => $negative,
            'neutral' => $neutral,
            'positive_percent' => $total > 0 ? round(($positive / $total) * 100, 1) : 0,
            'negative_percent' => $total > 0 ? round(($negative / $total) * 100, 1) : 0,
            'neutral_percent' => $total > 0 ? round(($neutral / $total) * 100, 1) : 0,
            'average_score' => round($avgScore, 3),
            'overall_sentiment' => $this->determineSentiment($avgScore),
        ];
    }
}