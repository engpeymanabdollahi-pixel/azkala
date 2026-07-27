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
        
        // ✅ تولید نام پیش‌فرض اگر وارد نشده باشد
        $defaultName = $name ?: 'کاربر ' . substr($phone, -4);
        
        // ✅ تولید ایمیل پیش‌فرض و یکتا اگر وارد نشده باشد (برای رفع خطای NOT NULL)
        $defaultEmail = $email ?: "user_{$phone}@azkala.local";
        
        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => $defaultName,
                'email' => $defaultEmail,
                'role' => 'customer'
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
        if (!$this->otpService->verify($phone, $otp)) {
            throw ValidationException::withMessages(['otp' => 'کد تایید نامعتبر یا منقضی شده است.']);
        }

        $defaultName = 'کاربر ' . substr($phone, -4);
        $defaultEmail = "user_{$phone}@azkala.local";

        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => $defaultName,
                'email' => $defaultEmail,
                'role' => 'customer'
            ]
        );

        // حذف توکن‌های قبلی برای امنیت بیشتر (اختیاری اما توصیه‌شده)
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

        if (!$user || !Hash::check($password, $user->password)) {
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