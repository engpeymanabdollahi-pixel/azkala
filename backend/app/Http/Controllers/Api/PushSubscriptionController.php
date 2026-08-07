<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PushSubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    protected PushSubscriptionService $pushSubscriptionService;

    public function __construct(PushSubscriptionService $pushSubscriptionService)
    {
        $this->pushSubscriptionService = $pushSubscriptionService;
    }

    /**
     * ذخیره subscription
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|max:500',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $subscription = $this->pushSubscriptionService->saveSubscription(Auth::id(), $validated);

        return response()->json([
            'success' => true,
            'message' => 'Subscription saved',
            'data' => $subscription,
        ]);
    }

    /**
     * حذف subscription
     */
    public function destroy($id)
    {
        $deactivated = $this->pushSubscriptionService->deactivateSubscription((int) $id, Auth::id());

        if (!$deactivated) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Unsubscribed']);
    }

    /**
     * ارسال نوتیفیکیشن تست
     */
    public function sendTest()
    {
        $result = $this->pushSubscriptionService->sendTestNotification(Auth::id());

        if (!$result['sent']) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscriptions',
            ]);
        }

        return response()->json([
            'success' => true,
            'results' => $result['results'],
        ]);
    }

    /**
     * ارسال نوتیفیکیشن سفارشی
     */
    public function sendCustom(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'url' => 'nullable|string|max:500',
            'extra_data' => 'nullable|array',
        ]);

        $result = $this->pushSubscriptionService->sendCustomNotification(
            Auth::id(),
            $validated['title'],
            $validated['body'],
            $validated['url'] ?? '/',
            $validated['extra_data'] ?? []
        );

        if (!$result['sent']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'No active subscriptions',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'success_count' => $result['success_count'],
                'total_count' => $result['total_count'],
            ],
        ]);
    }

    /**
     * دریافت کلید VAPID Public
     */
    public function getVapidPublicKey()
    {
        return response()->json([
            'success' => true,
            'publicKey' => config('webpush.vapid.public_key'),
        ]);
    }
}