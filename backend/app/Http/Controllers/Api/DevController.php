<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

/**
 * کنترلر مخصوص محیط توسعه
 * 
 * فقط در APP_ENV=local فعال می‌شود.
 * برای تست OTP بدون نیاز به پیامک واقعی.
 */
class DevController extends Controller
{
    /**
     * دریافت OTP ذخیره‌شده در cache برای یک شماره
     * 
     * فقط در محیط local کار می‌کند.
     * در production این route اصلاً ثبت نمی‌شود.
     */
    public function getOtp(string $phone)
    {
        // 🛡️ فقط در محیط local
        if (app()->environment() !== 'local') {
            abort(404);
        }

        $otp = Cache::get('otp_' . $phone);

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'OTP یافت نشد. ابتدا درخواست ثبت‌نام کنید.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'otp' => (string) $otp,
            'phone' => $phone,
        ]);
    }

    /**
     * Login سریع ادمین (فقط dev)
     * 
     * برای تست بدون نیاز به OTP
     */
    public function adminLogin()
    {
        if (app()->environment() !== 'local') {
            abort(404);
        }

        $admin = User::where('role', 'admin')->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin user not found',
            ], 404);
        }

        // ساخت token
        $token = $admin->createToken('dev_admin_token')->plainTextToken;

        // ورود stateful (برای cookie)
        auth()->guard('web')->login($admin);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $admin,
                'token' => $token,
            ],
            'message' => 'Admin logged in successfully (dev mode)',
        ]);
    }
}