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