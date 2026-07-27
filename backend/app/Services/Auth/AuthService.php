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
        
        $user = User::firstOrCreate(
            ['phone' => $phone],
            ['email' => $email, 'name' => $name, 'role' => 'customer']
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

        $user = User::firstOrCreate(
            ['phone' => $phone],
            ['role' => 'customer']
        );

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

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'ورود با موفقیت انجام شد',
            'user' => $user,
            'token' => $token,
        ];
    }
}