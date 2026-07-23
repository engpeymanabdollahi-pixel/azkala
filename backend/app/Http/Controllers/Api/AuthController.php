<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * مرحله ۱: دریافت شماره موبایل و ارسال OTP
     */
    public function register(Request $request)
    {
        try {
            $request->validate([
                'phone' => 'required|regex:/^09[0-9]{9}$/',
            ]);

            $phone = $request->phone;
            $otp = (string) rand(10000, 99999);

            // ذخیره کد در کش به مدت ۲ دقیقه
            Cache::put('otp_' . $phone, $otp, now()->addMinutes(2));

            // ثبت کد در لاگ
            Log::info("🔑 کد تأیید (OTP) برای شماره {$phone} برابر است با: {$otp}");

            // اگر کاربر وجود نداشت، یک کاربر موقت بساز
            User::firstOrCreate(
                ['phone' => $phone],
                ['name' => 'کاربر جدید', 'role' => 'customer', 'email' => $phone . '@azkala.temp']
            );

            return response()->json([
                'success' => true,
                'message' => 'کد تأیید با موفقیت ارسال شد. (فایل laravel.log را چک کنید)',
                'phone' => $phone
            ], 200);

               } catch (\Exception $e) {
            // 🔥 تغییر موقت: نمایش خطای واقعی به جای پیام کلی
            return response()->json([
                'success' => false,
                'message' => 'خطای واقعی: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * مرحله ۲: تأیید کد OTP و ورود کاربر
     */
    public function handleOtp(Request $request)
    {
        try {
            $request->validate([
                'phone' => 'required|regex:/^09[0-9]{9}$/',
                'otp' => 'required|string|size:5' // OTP ما ۴ رقمی است
            ]);

            $phone = $request->phone;
            $otp = (string) $request->otp;
            $cachedOtp = Cache::get('otp_' . $phone);

            if (!$cachedOtp || (string) $cachedOtp !== $otp) {
                return response()->json([
                    'success' => false, 
                    'message' => 'کد تایید نامعتبر یا منقضی است.'
                ], 422);
            }

            // حذف کد از کش پس از استفاده موفق
            Cache::forget('otp_' . $phone);

            $user = User::where('phone', $phone)->first();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'ورود با موفقیت انجام شد.',
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@handleOtp: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در تأیید کد',
            ], 500);
        }
    }

    public function login(LoginRequest $request)
    {
        try {
            $validated = $request->validated();
            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'ایمیل یا رمز عبور اشتباه است',
                ], 401);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                ],
                'message' => 'ورود با موفقیت انجام شد',
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@login: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ورود',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'خروج با موفقیت انجام شد',
            ]);
        } catch (\Exception $e) {
            Log::error('AuthController@logout: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در خروج',
            ], 500);
        }
    }

    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    public function update(UpdateProfileRequest $request)
    {
        try {
            $validated = $request->validated();
            $user = $request->user();
            $user->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'اطلاعات با موفقیت به‌روزرسانی شد',
                'data' => [
                    'user' => new UserResource($user->fresh()),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در به‌روزرسانی اطلاعات',
            ], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            $validated = $request->validated();
            $user = $request->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'رمز عبور فعلی اشتباه است',
                ], 400);
            }

            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'رمز عبور با موفقیت تغییر کرد',
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@changePassword: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در تغییر رمز عبور',
            ], 500);
        }
    }

    /**
     * دریافت وضعیت درخواست فروشندگی کاربر فعلی
     */
    public function getSellerRequestStatus()
    {
        $requestModel = \App\Models\SellerRequest::where('user_id', auth()->id())
            ->latest()
            ->first();

        return response()->json([
            'success' => true,
            'data' => $requestModel,
        ]);
    }
}