<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Models\User;
use App\Services\Auth\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

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
    'phone' => $validated['phone'], // ✅ در سطح ریشه
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
        // ۱. پیدا کردن کاربر بر اساس شماره موبایل
        $user = User::where('phone', $request->phone)->first();

        // ۲. بررسی وجود کاربر و صحت رمز عبور
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'شماره موبایل یا رمز عبور اشتباه است.',
            ], 401);
        }

        // ۳. بررسی فعال بودن کاربر
        if (!$user->is_active) {
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
                'user' => $user, // یا UserResource::make($user) اگر دارید
                'token' => $token,
            ]
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
     * دریافت اطلاعات کاربر فعلی
     */
    public function user(Request $request)
    {
        $user = $request->user();

        // 🛡️ لایه امنیتی ۲: اگر اکانت غیرفعال شد یا نقشش تغییر کرد، فوراً دسترسی قطع شود
        if (!$user->is_active) {
            return response()->json(['message' => 'حساب کاربری شما غیرفعال است.'], 403);
        }
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