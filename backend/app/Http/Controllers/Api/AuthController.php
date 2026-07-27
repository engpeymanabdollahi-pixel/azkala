<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * ثبت‌نام یا درخواست کد تایید
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|regex:/^09[0-9]{9}$/',
            'email' => 'nullable|email',
            'name' => 'nullable|string|max:255',
        ]);

        $result = $this->authService->registerOrRequestOtp(
            $validated['phone'],
            $validated['email'] ?? null,
            $validated['name'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => ['user_id' => $result['user_id']]
        ], 200);
    }

    /**
     * بررسی کد OTP و ورود
     */
    public function handleOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string|size:5',
        ]);

        $result = $this->authService->handleOtpLogin($validated['phone'], $validated['otp']);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'user' => $result['user'],
                'token' => $result['token'],
            ]
        ], 200);
    }

    /**
     * ورود با ایمیل و رمز عبور
     */
    public function login(LoginRequest $request)
    {
        $result = $this->authService->loginWithEmail(
            $request->email,
            $request->password
        );

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'user' => $result['user'],
                'token' => $result['token'],
            ]
        ], 200);
    }

    /**
     * خروج از حساب کاربری
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'با موفقیت خارج شدید',
        ], 200);
    }

    /**
     * دریافت اطلاعات کاربر فعلی
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ], 200);
    }

    /**
     * به‌روزرسانی پروفایل
     */
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'پروفایل با موفقیت به‌روزرسانی شد',
            'data' => $user->fresh(),
        ], 200);
    }

    /**
     * تغییر رمز عبور
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'رمز عبور با موفقیت تغییر کرد',
        ], 200);
    }

    /**
     * دریافت وضعیت درخواست فروشندگی
     */
    public function getSellerRequestStatus(Request $request)
    {
        $sellerRequest = $request->user()->sellerRequest;

        return response()->json([
            'success' => true,
            'data' => $sellerRequest ? [
                'status' => $sellerRequest->status,
                'message' => $sellerRequest->rejection_reason,
            ] : null,
        ], 200);
    }
}