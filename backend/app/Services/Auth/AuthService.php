<?php

namespace App\Services\Auth;

use App\Models\Setting;
use App\Models\User;
use App\Services\Referral\ReferralService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Support\SecurityLog;
use App\Support\SensitiveDataSanitizer;

class AuthService
{
    protected OtpService $otpService;

    protected ReferralService $referralService;

    public function __construct(OtpService $otpService, ReferralService $referralService = new ReferralService)
    {
        $this->otpService = $otpService;
        $this->referralService = $referralService;
    }

    /**
     * ثبت‌نام یا درخواست OTP
     *
     * ✅ Referral System Phase 2: چون کاربر همین‌جا (نه در verify-otp) با
     * firstOrCreate واقعاً در DB ساخته می‌شود، این تنها نقطه‌ی صحیح برای
     * capture کردن Referral Code است (رجوع به Phase 1 Audit، بخش ۳).
     * wasRecentlyCreated دقیقاً تشخیص می‌دهد که آیا این کاربر *همین الان*
     * ساخته شد یا از قبل وجود داشت — بدون آن، درخواست دوم/تکراری OTP برای
     * یک شماره‌ی موجود دوباره تلاش می‌کرد یک Referral بسازد (که
     * ReferralService خودش هم duplicate را رد می‌کند، اما این چک اینجا
     * حتی از رسیدن به آن مرحله هم جلوگیری می‌کند).
     */
    public function registerOrRequestOtp(string $phone, ?string $email = null, ?string $name = null, ?string $referralCode = null): array
    {
        // ✅ فاز ۳ تسک P0 SETTINGS/SECURITY FIX: پیش از این، registration_enabled
        // فقط یک ردیف Setting بدون هیچ مصرف‌کننده‌ی واقعی بود (کاملاً no-op).
        // این تنها نقطه‌ی صحیح enforcement است چون همین متد (نه verify-otp)
        // واقعاً کاربر جدید می‌سازد — رجوع به کامنت wasRecentlyCreated بالا.
        // عمداً فقط شماره‌های *جدید* (بدون کاربر موجود) را رد می‌کند: این
        // Setting درباره‌ی «ثبت‌نام» است نه «ورود» — یک کاربر موجود باید
        // همیشه بتواند صرف‌نظر از این کلید دوباره OTP بگیرد و وارد شود،
        // وگرنه غیرفعال کردن ثبت‌نام به‌طور جانبی همه را هم از ورود محروم
        // می‌کرد (یک باگ به‌مراتب بدتر از خودِ feature).
        $isNewPhone = ! User::where('phone', $phone)->exists();

        if ($isNewPhone && ! (bool) Setting::get('registration_enabled', true)) {
            SecurityLog::service('auth.register.disabled', [
                'phone_mask' => SensitiveDataSanitizer::maskPhone($phone),
                'phone_hash' => SensitiveDataSanitizer::hashIdentifier($phone),
            ]);

            throw ValidationException::withMessages([
                'phone' => 'ثبت‌نام کاربران جدید در حال حاضر غیرفعال است.',
            ]);
        }

        SecurityLog::service('auth.register.request', [
            'phone_mask'  => SensitiveDataSanitizer::maskPhone($phone),
            'phone_hash'  => SensitiveDataSanitizer::hashIdentifier($phone),
            'is_new_user' => $isNewPhone,
        ]);

        $this->otpService->generateAndCache($phone);

        $defaultName = $name ?: 'کاربر '.substr($phone, -4);
        $defaultEmail = $email ?: "user_{$phone}@azkala.local";

        // ✅ رفع خطای NOT NULL: تولید یک پسورد هش‌شده پیش‌فرض
        $defaultPassword = Hash::make('otp_user_'.$phone);

        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => $defaultName,
                'email' => $defaultEmail,
                'password' => $defaultPassword, // ✅ اضافه شد
                'role' => 'customer',
                // ✅ ستون در دیتابیس true دیفالت دارد، اما مدل درون‌حافظه‌ای
                // که firstOrCreate برمی‌گرداند فقط مقادیر صریحاً پاس‌داده‌شده
                // را دارد — بدون این خط، is_active اینجا null می‌ماند.
                'is_active' => true,
            ]
        );

        if ($user->wasRecentlyCreated) {
            $this->referralService->captureReferral($user, $referralCode);
        }

        return [
            'message' => 'کد تایید برای شما ارسال شد',
            'user_id' => $user->id,
        ];
    }

    /**
     * ورود با OTP
     */
    public function handleOtpLogin(string $phone, string $otp): array
    {
        if (! $this->otpService->verify($phone, $otp)) {
            SecurityLog::service('auth.otp.verify.failure', [
                'phone_mask' => SensitiveDataSanitizer::maskPhone($phone),
                'phone_hash' => SensitiveDataSanitizer::hashIdentifier($phone),
                'reason'     => 'invalid_code',
            ]);

            throw ValidationException::withMessages(['otp' => 'کد تایید نامعتبر یا منقضی شده است.']);
        }

        $defaultName = 'کاربر '.substr($phone, -4);
        $defaultEmail = "user_{$phone}@azkala.local";

        // ✅ رفع خطای NOT NULL: تولید یک پسورد هش‌شده پیش‌فرض
        $defaultPassword = Hash::make('otp_user_'.$phone);

        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => $defaultName,
                'email' => $defaultEmail,
                'password' => $defaultPassword, // ✅ اضافه شد
                'role' => 'customer',
                // ✅ قبلاً اینجا نبود؛ ستون در دیتابیس true دیفالت دارد ولی
                // مدل درون‌حافظه‌ای که firstOrCreate برمی‌گرداند فقط همان
                // مقادیری را دارد که صریحاً پاس داده شده‌اند — یعنی
                // is_active همین‌جا null می‌ماند (با cast بولین یعنی false).
                // چون همین شیء هم در پاسخ verify-otp سریالایز می‌شود و هم
                // مستقیماً به Auth::guard('web')->login() داده می‌شود، کاربر
                // تازه‌ثبت‌نام‌شده با OTP همان لحظه‌ی اول «غیرفعال» دیده
                // می‌شد و /user با ۴۰۳ رد می‌کرد.
                'is_active' => true,
            ]
        );
        

                SecurityLog::service('auth.otp.verify.success', [
            'user_id'    => $user->id,
            'phone_mask' => SensitiveDataSanitizer::maskPhone($phone),
            'phone_hash' => SensitiveDataSanitizer::hashIdentifier($phone),
        ]);

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'ورود با موفقیت انجام شد',
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * ورود با ایمیل و رمز عبور
     */
    public function loginWithEmail(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages(['email' => 'ایمیل یا رمز عبور اشتباه است.']);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'ورود با موفقیت انجام شد',
            'user' => $user,
            'token' => $token,
        ];
    }
}
