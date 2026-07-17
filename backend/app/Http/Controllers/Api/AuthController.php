<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'role' => 'customer',
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                ],
                'message' => 'ثبت‌نام با موفقیت انجام شد',
            ], 201);

        } catch (\Exception $e) {
            Log::error('AuthController@register: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ثبت نام',
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

    public function handleOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|regex:/^09[0-9]{9}$/',
            'otp' => 'nullable|string|size:5'
        ]);

        $phone = trim($request->phone);
        $otp = (string) $request->otp;
        $throttleKey = 'otp_request:' . $phone;

        // حالت اول: درخواست ارسال کد (با بررسی Rate Limit)
        if (!$otp) {
            if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts = 3)) {
                $seconds = RateLimiter::availableIn($throttleKey);
                return response()->json([
                    'success' => false,
                    'message' => 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً ' . $seconds . ' ثانیه دیگر تلاش کنید.',
                ], 429);
            }

            RateLimiter::hit($throttleKey, $decaySeconds = 60);

            $newOtp = (string) rand(10000, 99999);
            Cache::put('otp_' . $phone, $newOtp, now()->addMinutes(5));
            
            Log::info('OTP Generated', ['phone' => $phone, 'otp' => $newOtp]);
            
            return response()->json([
                'success' => true,
                'message' => 'کد تایید ارسال شد.',
                'debug_otp' => $newOtp // فقط برای محیط تست
            ]);
        }

        // حالت دوم: درخواست تایید کد
        $cachedOtp = Cache::get('otp_' . $phone);

        if (!$cachedOtp || (string) $cachedOtp !== $otp) {
            return response()->json([
                'success' => false, 
                'message' => 'کد تایید نامعتبر یا منقضی است.'
            ], 422);
        }

        Cache::forget('otp_' . $phone);

        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => 'کاربر ' . substr($phone, -4),
                'email' => $phone . '@azkala.temp',
                'role' => 'customer',
                'password' => Hash::make(Str::random(16))
            ]
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'ورود با موفقیت انجام شد.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ]
        ]);
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
        $request = \App\Models\SellerRequest::where('user_id', auth()->id())
            ->latest()
            ->first();

        return response()->json([
            'success' => true,
            'data' => $request, // اگر null باشد یعنی درخواستی نداده است
        ]);
    }
}