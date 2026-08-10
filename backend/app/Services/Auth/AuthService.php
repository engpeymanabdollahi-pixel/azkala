<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * ثبت‌نام یا درخواست OTP
     */
    public function registerOrRequestOtp(string $phone, ?string $email = null, ?string $name = null): array
    {
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
