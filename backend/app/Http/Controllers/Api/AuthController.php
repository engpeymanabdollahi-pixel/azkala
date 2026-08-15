<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use App\Services\Auth\AuthService;
use App\Support\Digits;
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
     */
    public function register(Request $request)
    {
        // پاک‌سازی *پیش از* اعتبارسنجی. اگر بعد از validate انجام شود بی‌اثر است،
        // چون خودِ regex هر رشته‌ای با فاصله یا خط تیره را از قبل رد کرده است.
        //
        // «۰۹۱۲۳۴۵۶۷۸۹» با ارقام فارسی هم همین‌جا رد می‌شد: [0-9] فقط ارقام
        // لاتین را می‌گیرد و کاربرِ کیبورد فارسی بدون هیچ توضیحی خطا می‌گرفت.
        $request->merge([
            'phone' => Str::replace([' ', '-', '+', '(', ')'], '', Digits::toLatin($request->input('phone'))),
            'email' => $request->filled('email') ? Str::lower(trim((string) $request->input('email'))) : $request->input('email'),
            'name' => $request->filled('name') ? Str::squish((string) $request->input('name')) : $request->input('name'),
        ]);

        $validated = $request->validate([
            'phone' => 'required|string|regex:/^09[0-9]{9}$/',
            'email' => 'nullable|email|max:255',
            'name' => 'nullable|string|max:255',
            // ✅ Referral System Phase 2: عمداً هیچ regex/format-validation
            // سخت‌گیرانه‌ای اینجا نیست — طبق الزام صریح «Referral نباید
            // Registration را خراب کند»، یک کد بدفرمت/نامعتبر نباید کل
            // درخواست ثبت‌نام را با ۴۲۲ رد کند. اعتبارسنجی واقعی فرمت/
            // وجود کد داخل ReferralService است (silent no-op برای هر
            // چیزی که معتبر نباشد).
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
            'phone' => $validated['phone'], // ✅ در سطح ریشه
            'data' => ['user_id' => $result['user_id']],
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

        // ✅ قبلاً اینجا فقط توکن Bearer برمی‌گشت، برخلاف login() که هم نشست
        // کوکی‌محور می‌ساخت هم توکن. چون توکن فقط در حافظه‌ی Zustand می‌ماند
        // (عمداً در localStorage ذخیره نمی‌شود)، با هر reload/تب جدید توکن از
        // بین می‌رفت و هیچ کوکی نشست معتبری هم برای جایگزینی‌اش وجود نداشت —
        // یعنی کاربری که با OTP وارد شده بود (مسیر اصلی AuthModal) با اولین
        // رفرش کاملاً از دسترسی می‌افتاد، هرچند isAuthenticated/user در
        // localStorage باقی مانده بودند. همان رفتار login() اینجا هم اعمال شد.
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
     * ورود با ایمیل و رمز عبور
     */
    public function login(LoginRequest $request)
    {
        // ۱. پیدا کردن کاربر بر اساس شماره موبایل
        $user = User::where('phone', $request->phone)->first();

        // ۲. بررسی وجود کاربر و صحت رمز عبور
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'شماره موبایل یا رمز عبور اشتباه است.',
            ], 401);
        }

        // ۳. بررسی فعال بودن کاربر
        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'حساب کاربری شما غیرفعال است.',
            ], 403);
        }

        // ۴. به‌روزرسانی زمان آخرین ورود
        $user->update(['last_login_at' => now()]);

        // ۵. ورود به نشست (احراز هویت کوکی‌محور Sanctum)
        //
        // کوکی نشست httpOnly است، پس برخلاف توکن در localStorage با XSS خوانده
        // نمی‌شود و بعد از refresh صفحه هم باقی می‌ماند. تا پیش از این توکن در
        // store نگهداری می‌شد ولی persist نمی‌شد، و چون isAuthenticated persist
        // می‌شد، هر بار reload کاربر «لاگین» بود ولی بدون توکن — یعنی اولین
        // درخواست ۴۰۱ می‌گرفت و interceptor بیرونش می‌انداخت.
        //
        // این مسیر فقط وقتی نشست می‌سازد که درخواست stateful باشد؛ یعنی مبدأ
        // در SANCTUM_STATEFUL_DOMAINS باشد.
        // درخواستِ غیر stateful (موبایل، اسکریپت، cURL) اصلاً session store ندارد؛
        // صدا زدن session() روی آن استثنا می‌دهد. آن مسیر فقط با توکن پیش می‌رود.
        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        // ۶. توکن هم ساخته می‌شود تا کلاینت‌های غیرمرورگری (موبایل، اسکریپت)
        //    که نشست ندارند از کار نیفتند.
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
        $token = $request->user()->currentAccessToken();

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

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $newToken,
                    'user' => $this->userPayload($user),
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Token refresh failed: '.$e->getMessage());

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
