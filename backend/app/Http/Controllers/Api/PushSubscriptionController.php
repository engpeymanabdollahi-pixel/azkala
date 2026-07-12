<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Support\VAPID;
use App\Support\WebPush;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
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

        $user = Auth::user();

        $subscription = PushSubscription::updateOrCreate(
            ['endpoint' => $validated['endpoint']],
            [
                'user_id' => $user->id,
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'is_active' => true,
            ]
        );

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
        $subscription = PushSubscription::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $subscription->deactivate();

        return response()->json(['success' => true, 'message' => 'Unsubscribed']);
    }

    /**
     * ارسال نوتیفیکیشن تست
     */
    public function sendTest()
    {
        $user = Auth::user();
        $subscriptions = PushSubscription::where('user_id', $user->id)->active()->get();

        if ($subscriptions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscriptions',
            ]);
        }

        $webPush = new WebPush();
        $payload = [
            'title' => 'تست نوتیفیکیشن',
            'body' => 'این یک پیام تست از ازکالا است',
            'icon' => '/icons/icon-192.png',
            'badge' => '/icons/icon-192.png',
            'url' => '/',
            'tag' => 'test',
        ];

        $results = [];
        foreach ($subscriptions as $sub) {
            $result = $webPush->send($sub->toWebPushArray(), $payload);
            $results[] = $result;
            
            if ($result['success']) {
                $sub->markAsUsed();
            } else {
                $sub->deactivate();
            }
        }

        return response()->json([
            'success' => true,
            'results' => $results,
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