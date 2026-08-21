<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use App\Services\Auth\AuthService;
use App\Support\Digits;
use App\Support\SecurityLog;
use App\Support\SensitiveDataSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * ✅ سیستم Multi-Admin/Manager (بخش ۱۸ درخواست): هر پاسخی که شامل
     * User باشد باید administrative_role/permissions را هم برای
     * authStore.ts بفرستد — یک نقطه‌ی واحد به‌جای تکرار در ۴ متد
     * (login/handleOtp/refresh/user). برای غیر-admin این دو فیلد همیشه
     * null/[] هستند (رجوع به User::administrativeAccessSummary).
     */
    private function userPayload(User $user): array
    {
        return array_merge($user->toArray(), $user->administrativeAccessSummary());
    }

    /**
     * ثبت‌نام یا درخواست کد تایید
     *
     * 📝 Security logging در AuthService::registerOrRequestOtp انجام می‌شود
     *    (auth.register.request و auth.register.disabled).
     */
    public function register(Request $request)
    {
        $request->merge([
            'phone' => Str::replace([' ', '-', '+', '(', ')'], '', Digits::toLatin($request->input('phone'))),
            'email' => $request->filled('email') ? Str::lower(trim((string) $request->input('email'))) : $request->input('email'),
            'name' => $request->filled('name') ? Str::squish((string) $request->input('name')) : $request->input('name'),
        ]);

        $validated = $request->validate([
            'phone' => 'required|string|regex:/^09[0-9]{9}$/',
            'email' => 'nullable|email|max:255',
            'name' => 'nullable|string|max:255',
            'ref' => 'nullable|string|max:32',
        ]);

        $result = $this->authService->registerOrRequestOtp(
            $validated['phone'],
            $validated['email'] ?? null,
            $validated['name'] ?? null,
            $validated['ref'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'phone' => $validated['phone'],
            'data' => ['user_id' => $result['user_id']],
        ], 200);
    }

    /**
     * بررسی کد OTP و ورود
     *
     * 📝 Security logging در AuthService::handleOtpLogin انجام می‌شود
     *    (auth.otp.verify.success و auth.otp.verify.failure).
     */
    public function handleOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string|size:5',
        ]);

        $result = $this->authService->handleOtpLogin($validated['phone'], $validated['otp']);

        if ($request->hasSession()) {
            Auth::guard('web')->login($result['user']);
            $request->session()->regenerate();
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'user' => $this->userPayload($result['user']),
                'token' => $result['token'],
            ],
        ], 200);
    }

    /**
     * ورود با شماره موبایل و رمز عبور
     *
     * 📝 Note: مسیر اصلی ورود ازکالا OTP است (handleOtp). این endpoint
     *    به‌عنوان مسیر جایگزین/آتی حفظ شده و security logging کامل دارد.
     */
    public function login(LoginRequest $request)
    {
        // ۱. پیدا کردن کاربر بر اساس شماره موبایل
        $user = User::where('phone', $request->phone)->first();

        // ۲. بررسی وجود کاربر و صحت رمز عبور
        if (! $user || ! Hash::check($request->password, $user->password)) {
            SecurityLog::auth('auth.login.failure', $request, [
                'phone_mask' => SensitiveDataSanitizer::maskPhone($request->phone),
                'phone_hash' => SensitiveDataSanitizer::hashIdentifier($request->phone),
                'reason'     => 'invalid_credentials',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'شماره موبایل یا رمز عبور اشتباه است.',
            ], 401);
        }

        // ۳. بررسی فعال بودن کاربر
        if (! $user->is_active) {
            SecurityLog::auth('auth.login.failure', $request, [
                'user_id'    => $user->id,
                'phone_mask' => SensitiveDataSanitizer::maskPhone($request->phone),
                'phone_hash' => SensitiveDataSanitizer::hashIdentifier($request->phone),
                'reason'     => 'inactive_account',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'حساب کاربری شما غیرفعال است.',
            ], 403);
        }

        // ۴. به‌روزرسانی زمان آخرین ورود
        $user->update(['last_login_at' => now()]);

        SecurityLog::auth('auth.login.success', $request, [
            'user_id'    => $user->id,
            'phone_mask' => SensitiveDataSanitizer::maskPhone($user->phone),
            'phone_hash' => SensitiveDataSanitizer::hashIdentifier($user->phone),
        ]);

        // ۵. ورود به نشست (احراز هویت کوکی‌محور Sanctum)
        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        // ۶. توکن برای کلاینت‌های غیرمرورگری
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'ورود با موفقیت انجام شد',
            'data' => [
                'user' => $this->userPayload($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * خروج از حساب کاربری
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        SecurityLog::auth('auth.logout', $request, [
            'user_id' => $user->id,
        ]);

        $token = $user->currentAccessToken();

        // با احراز هویت کوکی‌محور، currentAccessToken یک TransientToken است که
        // اصلاً متد delete ندارد — صدا زدنش BadMethodCallException و ۵۰۰ می‌داد.
        // فقط توکن واقعیِ ذخیره‌شده حذف می‌شود.
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        // و نشست هم باید بسته شود، وگرنه کوکی همچنان معتبر می‌ماند و کاربر
        // عملاً خارج نشده است.
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'با موفقیت خارج شدید',
        ], 200);
    }

    /**
     * Refresh access token
     *
     * برای جلوگیری از logout ناگهانی وقتی token منقضی می‌شود
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated',
                ], 401);
            }

            // بررسی فعال بودن کاربر
            if (! $user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'حساب کاربری غیرفعال است',
                ], 403);
            }

            // حذف token قدیمی (فقط اگر PersonalAccessToken باشد)
            $currentToken = $user->currentAccessToken();
            if ($currentToken instanceof PersonalAccessToken) {
                $currentToken->delete();
            }

            // ساخت token جدید
            $newToken = $user->createToken('auth_token')->plainTextToken;

            // به‌روزرسانی last_login_at
            $user->update(['last_login_at' => now()]);

            SecurityLog::auth('auth.token.refresh.success', $request, [
                'user_id'    => $user->id,
                'phone_mask' => SensitiveDataSanitizer::maskPhone($user->phone),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $newToken,
                    'user' => $this->userPayload($user),
                ],
            ]);
        } catch (\Exception $e) {
            SecurityLog::auth('auth.token.refresh.failure', $request, [
                'user_id' => $request->user()?->id,
                'reason'  => 'exception',
                // هرگز $e->getMessage() را log نکن چون ممکن است token حاوی باشد
            ]);

            return response()->json([
                'success' => false,
                'message' => 'خطا در به‌روزرسانی نشست',
            ], 500);
        }
    }

    /**
     * دریافت اطلاعات کاربر فعلی
     */
    public function user(Request $request)
    {
        $user = $request->user();

        // 🛡️ لایه امنیتی ۲: اگر اکانت غیرفعال شد یا نقشش تغییر کرد، فوراً دسترسی قطع شود
        if (! $user->is_active) {
            return response()->json(['message' => 'حساب کاربری شما غیرفعال است.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->userPayload($user),
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
            'data' => $this->userPayload($user->fresh()),
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

        SecurityLog::auth('auth.password.change', $request, [
            'user_id' => $user->id,
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