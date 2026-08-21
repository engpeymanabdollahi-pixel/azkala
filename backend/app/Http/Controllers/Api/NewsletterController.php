<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewsletterWelcome;
use App\Models\NewsletterSubscriber;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NewsletterController extends Controller
{
    public function __construct(protected EmailService $emailService)
    {
    }

    /**
     * بررسی وضعیت اشتراک کاربر فعلی
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $subscriber = NewsletterSubscriber::where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'is_subscribed' => $subscriber && $subscriber->subscribed_at && !$subscriber->unsubscribed_at,
                'email' => $subscriber?->email,
                'subscribed_at' => $subscriber?->subscribed_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Subscribe به خبرنامه
     */
    public function subscribe(Request $request)
    {
        $user = $request->user();

        // بررسی اینکه کاربر ایمیل دارد
        if (empty($user->email)) {
            return response()->json([
                'success' => false,
                'message' => 'لطفاً ابتدا ایمیل خود را در پروفایل ثبت کنید.',
            ], 422);
        }

        // بررسی اینکه قبلاً subscribe نکرده
        $existingSubscriber = NewsletterSubscriber::where('user_id', $user->id)->first();

        if ($existingSubscriber && $existingSubscriber->subscribed_at && !$existingSubscriber->unsubscribed_at) {
            return response()->json([
                'success' => false,
                'message' => 'شما قبلاً در خبرنامه عضو شده‌اید.',
            ], 409);
        }

        try {
            // اگر قبلاً unsubscribe کرده بود، re-subscribe کن
            if ($existingSubscriber) {
                $existingSubscriber->update([
                    'subscribed_at' => now(),
                    'unsubscribed_at' => null,
                    'email' => $user->email,
                ]);
                $subscriber = $existingSubscriber;
            } else {
                $subscriber = NewsletterSubscriber::create([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'subscribed_at' => now(),
                    'is_confirmed' => true,
                ]);
            }

            // Send welcome email
            try {
                $this->emailService->sendWelcome($subscriber->email, $user->name ?? 'کاربر عزیز');
            } catch (\Throwable $e) {
                Log::warning('Failed to send newsletter welcome email', [
                    'user_id' => $user->id,
                    'email' => $subscriber->email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'با موفقیت در خبرنامه عضو شدید! 🎉',
                'data' => [
                    'subscriber_id' => $subscriber->id,
                    'email' => $subscriber->email,
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Newsletter subscription failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'خطا در عضویت. لطفاً دوباره تلاش کنید.',
            ], 500);
        }
    }

    /**
     * Unsubscribe از خبرنامه
     */
    public function unsubscribe(Request $request)
    {
        $user = $request->user();
        $subscriber = NewsletterSubscriber::where('user_id', $user->id)->first();

        if (!$subscriber) {
            return response()->json([
                'success' => false,
                'message' => 'شما در خبرنامه عضو نیستید.',
            ], 404);
        }

        if ($subscriber->unsubscribed_at) {
            return response()->json([
                'success' => true,
                'message' => 'شما قبلاً از خبرنامه خارج شده‌اید.',
            ]);
        }

        $subscriber->update([
            'unsubscribed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'با موفقیت از خبرنامه خارج شدید.',
        ]);
    }
}