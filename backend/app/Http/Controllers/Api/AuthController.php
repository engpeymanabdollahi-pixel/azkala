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

class AuthController extends Controller
{
    /**
     * ط«ط¨طھ ظ†ط§ظ… ع©ط§ط±ط¨ط± ط¬ط¯غŒط¯
     */
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
                'message' => 'Registration successful',
            ], 201);

        } catch (\Exception $e) {
            Log::error('AuthController@register: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ط®ط·ط§ ط¯ط± ط«ط¨طھ ظ†ط§ظ…',
            ], 500);
        }
    }

    /**
     * ظˆط±ظˆط¯ ع©ط§ط±ط¨ط±
     */
    public function login(LoginRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'ط§غŒظ…غŒظ„ غŒط§ ط±ظ…ط² ط¹ط¨ظˆط± ط§ط´طھط¨ط§ظ‡ ط§ط³طھ',
                ], 401);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                ],
                'message' => 'Login successful',
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@login: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ط®ط·ط§ ط¯ط± ظˆط±ظˆط¯',
            ], 500);
        }
    }

    /**
     * ط®ط±ظˆط¬ ع©ط§ط±ط¨ط±
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    /**
     * ط¯ط±غŒط§ظپطھ ط§ط·ظ„ط§ط¹ط§طھ ع©ط§ط±ط¨ط± ظپط¹ظ„غŒ
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    /**
     * ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ظ¾ط±ظˆظپط§غŒظ„ ع©ط§ط±ط¨ط±
     */
    public function update(UpdateProfileRequest $request)
    {
        try {
            $validated = $request->validated();
            $user = $request->user();

            $user->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'ط§ط·ظ„ط§ط¹ط§طھ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ط´ط¯',
                'data' => [
                    'user' => new UserResource($user->fresh()),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ط®ط·ط§ ط¯ط± ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ط§ط·ظ„ط§ط¹ط§طھ',
            ], 500);
        }
    }

    /**
     * طھط؛غŒغŒط± ط±ظ…ط² ط¹ط¨ظˆط±
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            $validated = $request->validated();
            $user = $request->user();

            // ط¨ط±ط±ط³غŒ ط±ظ…ط² ظپط¹ظ„غŒ
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'ط±ظ…ط² ط¹ط¨ظˆط± ظپط¹ظ„غŒ ط§ط´طھط¨ط§ظ‡ ط§ط³طھ',
                ], 400);
            }

            // ط¨ظ‡â€Œط±ظˆط²ط±ط³ط§ظ†غŒ ط±ظ…ط²
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ط±ظ…ط² ط¹ط¨ظˆط± ط¨ط§ ظ…ظˆظپظ‚غŒطھ طھط؛غŒغŒط± ع©ط±ط¯',
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@changePassword: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ط®ط·ط§ ط¯ط± طھط؛غŒغŒط± ط±ظ…ط² ط¹ط¨ظˆط±',
            ], 500);
        }
    }

    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|regex:/^09[0-9]{9}$/|unique:users,phone' // در ثبت نام اولیه یونیک است
        ]);

        $otp = rand(10000, 99999);
        // ذخیره در کش به مدت ۵ دقیقه
        Cache::put('otp_' . $request->phone, $otp, now()->addMinutes(5));

        // TODO: اینجا باید API ارسال پیامک (مثل کاوه‌نگار) فراخوانی شود
        // برای تست، کد را در پاسخ برمی‌گردانیم
        return response()->json([
            'success' => true,
            'message' => 'کد تایید ارسال شد.',
            'debug_otp' => $otp // فقط برای محیط توسعه
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|regex:/^09[0-9]{9}$/',
            'otp' => 'required|string|size:5'
        ]);

        $cachedOtp = Cache::get('otp_' . $request->phone);

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json(['success' => false, 'message' => 'کد تایید نامعتبر یا منقضی است.'], 422);
        }

        Cache::forget('otp_' . $request->phone);

        // پیدا کردن یا ساخت کاربر جدید
        $user = User::firstOrCreate(
            ['phone' => $request->phone],
            [
                'name' => 'کاربر ' . substr($request->phone, -4),
                'role' => 'customer',
                'password' => bcrypt(Str::random(16)) // رمز عبور تصادفی برای سازگاری با Sanctum
            ]
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'ورود موفقیت‌آمیز بود.',
            'token' => $token,
            'user' => $user
        ]);
    }}
