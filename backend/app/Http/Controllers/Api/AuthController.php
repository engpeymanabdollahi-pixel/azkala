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
    public function register(Request $request)
    {
        try {
            $request->validate([
                'phone' => 'required|regex:/^09[0-9]{9}$/',
            ]);

            $phone = $request->phone;
            $otp = (string) rand(10000, 99999);

            Cache::put('otp_' . $phone, $otp, now()->addMinutes(2));
            
            // Log without emoji to prevent any encoding issues in CI/CD
            Log::info("OTP code for phone {$phone} is: {$otp}");

            User::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => 'New User',
                    'role' => 'customer',
                    'email' => $phone . time() . '@azkala.temp',
                    'password' => Hash::make(Str::random(16))
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully.',
                'phone' => $phone
            ], 200);

        } catch (\Exception $e) {
            Log::error('AuthController@register: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error sending code: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function handleOtp(Request $request)
    {
        try {
            $request->validate([
                'phone' => 'required|regex:/^09[0-9]{9}$/',
                'otp' => 'required|string|size:5'
            ]);

            $phone = $request->phone;
            $otp = (string) $request->otp;
            $cachedOtp = Cache::get('otp_' . $phone);

            if (!$cachedOtp || (string) $cachedOtp !== $otp) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Invalid or expired verification code.'
                ], 422);
            }

            Cache::forget('otp_' . $phone);

            $user = User::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => 'User ' . substr($phone, -4),
                    'role' => 'customer',
                    'email' => $phone . time() . '@azkala.temp',
                    'password' => Hash::make(Str::random(16))
                ]
            );

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@handleOtp: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error verifying code: ' . $e->getMessage(),
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
                    'message' => 'Invalid email or password',
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
                'message' => 'Login error',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('AuthController@logout: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Logout error',
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
                'message' => 'Profile updated successfully',
                'data' => [
                    'user' => new UserResource($user->fresh()),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Update error',
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
                    'message' => 'Current password is incorrect',
                ], 400);
            }

            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('AuthController@changePassword: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Password change error',
            ], 500);
        }
    }

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