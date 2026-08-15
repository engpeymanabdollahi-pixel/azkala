<?php

namespace App\Services\Referral;

use App\Models\Referral;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

/**
 * هسته‌ی سیستم Referral (Phase 2 — فقط capture + pending، بدون Reward
 * Engine/Campaign/Anti-Fraud واقعی؛ رجوع به کامنت‌های migration و
 * Referral model برای معماری کامل).
 */
class ReferralService
{
    /**
     * الفبای امن: بدون 0/O/1/I/L (کاراکترهای گیج‌کننده — طبق درخواست).
     * ۳۱ کاراکتر × طول ۸ → فضای نمونه‌ی ۳۱^۸ ≈ 8.5×10^11، برای مقیاس این
     * پروژه عملاً غیرقابل‌حدس و بدون نیاز به collision handling سنگین.
     */
    private const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const CODE_LENGTH = 8;

    private const MAX_GENERATION_ATTEMPTS = 10;

    /**
     * یک کد ۸ کاراکتری تصادفی از الفبای امن می‌سازد — بدون بررسی
     * uniqueness (آن مسئولیت ensureUserReferralCode است). random_int
     * (نه mt_rand/str_shuffle) برای غیرقابل‌حدس بودن واقعی.
     */
    public function generateCode(): string
    {
        $alphabet = self::CODE_ALPHABET;
        $max = strlen($alphabet) - 1;
        $code = '';

        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= $alphabet[random_int(0, $max)];
        }

        return $code;
    }

    /**
     * کد معرف کاربر را برمی‌گرداند؛ اگر هنوز نداشت، همین‌جا (lazy) تولید،
     * unique-check و ذخیره می‌کند — دقیقاً همان مکانیزمی که به کاربران
     * قدیمی (قبل از این migration) بدون نیاز به ثبت‌نام دوباره کد می‌دهد.
     *
     * Immutable طبق سیاست: این متد فقط وقتی می‌نویسد که ستون از قبل خالی
     * باشد؛ کاربر عادی هیچ مسیری برای فراخوانی مستقیم این نوشتن ندارد
     * (UpdateProfileRequest شامل referral_code نیست، و اینجا از
     * forceFill استفاده می‌شود، نه mass-assignment عمومی).
     *
     * Race condition (دو request هم‌زمان برای همین کاربر): هر دو
     * $user->referral_code را null می‌بینند و هر کدام یک کد متفاوت
     * تولید می‌کنند؛ هیچ constraint دیتابیسی مانع نوشتن دوباره‌ی همان
     * ردیف نیست، پس آخرین save() برنده است — بی‌ضرر، چون uniqueness کلی
     * کدها را نمی‌شکند، فقط یکی از دو کدِ تولیدشده دور ریخته می‌شود.
     * Collision با کدِ کاربر *دیگری* با catch زیر و retry مدیریت می‌شود.
     */
    public function ensureUserReferralCode(User $user): string
    {
        if ($user->referral_code) {
            return $user->referral_code;
        }

        for ($attempt = 0; $attempt < self::MAX_GENERATION_ATTEMPTS; $attempt++) {
            $candidate = $this->generateCode();

            try {
                $user->forceFill(['referral_code' => $candidate])->save();

                return $candidate;
            } catch (QueryException $e) {
                if ($this->isUniqueConstraintViolation($e)) {
                    continue; // برخورد با کد کاربر دیگر — دوباره تولید کن
                }

                throw $e;
            }
        }

        throw new \RuntimeException('امکان تولید کد معرف یکتا وجود نداشت.');
    }

    /**
     * کاربر صاحب یک کد معرف را پیدا می‌کند. ورودی همیشه normalize
     * می‌شود (uppercase/trim) و فرمت‌های نامعتبر بی‌صدا null برمی‌گردانند
     * — این تابع هرگز نباید Exception بیندازد، چون از مسیر ثبت‌نام (که
     * نباید بشکند) صدا زده می‌شود.
     */
    public function findByCode(?string $rawCode): ?User
    {
        $normalized = $this->normalizeCode($rawCode);

        if (! $normalized) {
            return null;
        }

        return User::where('referral_code', $normalized)->first();
    }

    /**
     * نقطه‌ی ورود واقعی از AuthService::registerOrRequestOtp — فقط وقتی
     * صدا زده شود که $referred *همین الان* ساخته شده (wasRecentlyCreated)،
     * تا درخواست‌های تکراری OTP برای یک کاربر موجود هرگز Referral دوم
     * نسازند. کاملاً بی‌صدا (بدون Exception) در تمام مسیرهای شکست —
     * ثبت‌نام هرگز به‌خاطر Referral نباید fail کند.
     */
    public function captureReferral(User $referred, ?string $rawCode): void
    {
        if (! $rawCode) {
            return;
        }

        try {
            $referrer = $this->findByCode($rawCode);

            if (! $referrer) {
                return; // کد نامعتبر/ناموجود → سکوت
            }

            if ($referrer->id === $referred->id) {
                return; // self-referral
            }

            $this->createPendingReferral($referrer, $referred, $referrer->referral_code);
        } catch (\Throwable $e) {
            // ✅ دفاع نهایی: هر خطای پیش‌بینی‌نشده در مسیر Referral هرگز
            // نباید ثبت‌نام واقعی کاربر را بشکند.
            Log::warning('[Referral] خطا در capture کردن referral نادیده گرفته شد: '.$e->getMessage(), [
                'referred_user_id' => $referred->id,
            ]);
        }
    }

    /**
     * ساخت ردیف pending. duplicate prevention دو لایه دارد: چک صریح قبل
     * از insert (تجربه‌ی کاربری بهتر، بدون رفتن تا خطای دیتابیس) + catch
     * روی unique constraint واقعی (تنها تضمین قابل‌اتکا در برابر race
     * condition دو request هم‌زمان برای همان کاربر معرفی‌شده).
     */
    private function createPendingReferral(User $referrer, User $referred, string $code): void
    {
        if (Referral::where('referred_user_id', $referred->id)->exists()) {
            return; // این کاربر قبلاً توسط یک referral (همین یا دیگری) ثبت شده
        }

        try {
            Referral::create([
                'referrer_user_id' => $referrer->id,
                'referred_user_id' => $referred->id,
                'referral_code' => $code,
                'status' => Referral::STATUS_PENDING,
                'registered_at' => now(),
            ]);
        } catch (QueryException $e) {
            if (! $this->isUniqueConstraintViolation($e)) {
                throw $e;
            }
            // race condition: یک ردیف دیگر هم‌زمان برای همین referred_user_id
            // ساخته شد؛ idempotent — بی‌صدا نادیده گرفته می‌شود.
        }
    }

    /**
     * خلاصه‌ی Referral کاربر جاری برای GET /user/referral.
     */
    public function getReferralSummary(User $user): array
    {
        $code = $this->ensureUserReferralCode($user);

        return [
            'referral_code' => $code,
            'referral_link' => $this->buildReferralLink($code),
            'total_referrals' => Referral::where('referrer_user_id', $user->id)->count(),
            'pending_referrals' => Referral::where('referrer_user_id', $user->id)
                ->where('status', Referral::STATUS_PENDING)
                ->count(),
        ];
    }

    /**
     * دقیقاً همان زنجیره‌ی fallback که SitemapService از قبل برای ساخت
     * URLهای مطلق استفاده می‌کند (SITE_URL → FRONTEND_URL → پیش‌فرض) —
     * یک دامنه‌ی جدید اختراع نشد، از همان convention موجود استفاده شد.
     */
    private function buildReferralLink(string $code): string
    {
        $siteUrl = rtrim(env('SITE_URL', env('FRONTEND_URL', 'https://azkala.com')), '/');

        return "{$siteUrl}/register?ref={$code}";
    }

    private function normalizeCode(?string $rawCode): ?string
    {
        if (! $rawCode) {
            return null;
        }

        $normalized = strtoupper(trim($rawCode));

        if (! preg_match('/^[A-Z0-9]{8}$/', $normalized)) {
            return null;
        }

        return $normalized;
    }

    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        // کد خطای SQLSTATE 23000 (Integrity constraint violation) هم روی
        // MySQL هم SQLite (که تست‌های این پروژه با آن اجرا می‌شوند) پایدار
        // است.
        return $e->getCode() === '23000';
    }
}
