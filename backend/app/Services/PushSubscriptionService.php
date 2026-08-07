<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Support\WebPush;

class PushSubscriptionService
{
    public function saveSubscription(int $userId, array $data): PushSubscription
    {
        return PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id' => $userId,
                'public_key' => $data['keys']['p256dh'],
                'auth_token' => $data['keys']['auth'],
                'is_active' => true,
            ]
        );
    }

    public function deactivateSubscription(int $id, int $userId): bool
    {
        $subscription = PushSubscription::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$subscription) {
            return false;
        }

        $subscription->deactivate();

        return true;
    }

    public function sendTestNotification(int $userId): array
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->active()->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => false, 'results' => []];
        }

        $webPush = new WebPush();
        $payload = [
            'title' => 'تست نوتیفیکیشن',
            'body' => 'این یک پیام تست از ازکالا است',
            'icon' => '/icons/icon-192.png',
            'badge' => '/icons/icon-192.png',
            'url' => '/',
            'tag' => 'test',
            'timestamp' => now()->timestamp,
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

        return ['sent' => true, 'results' => $results];
    }

    /**
     * ارسال نوتیفیکیشن سفارشی
     */
    public function sendCustomNotification(int $userId, string $title, string $body, string $url = '/', array $extraData = []): array
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->active()->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => false, 'results' => [], 'message' => 'No active subscriptions'];
        }

        $webPush = new WebPush();
        $payload = array_merge([
            'title' => $title,
            'body' => $body,
            'icon' => '/icons/icon-192.png',
            'badge' => '/icons/icon-192.png',
            'url' => $url,
            'tag' => 'custom-' . time(),
            'timestamp' => now()->timestamp,
        ], $extraData);

        $results = [];
        $successCount = 0;
        
        foreach ($subscriptions as $sub) {
            $result = $webPush->send($sub->toWebPushArray(), $payload);
            $results[] = $result;

            if ($result['success']) {
                $sub->markAsUsed();
                $successCount++;
            } else {
                $sub->deactivate();
            }
        }

        return [
            'sent' => $successCount > 0,
            'success_count' => $successCount,
            'total_count' => $subscriptions->count(),
            'results' => $results
        ];
    }

    /**
     * ارسال نوتیفیکیشن به همه کاربران (برای ادمین)
     */
    public function broadcastNotification(string $title, string $body, string $url = '/', array $extraData = []): array
    {
        $subscriptions = PushSubscription::active()->get();

        if ($subscriptions->isEmpty()) {
            return ['sent' => false, 'results' => [], 'message' => 'No active subscriptions'];
        }

        $webPush = new WebPush();
        $payload = array_merge([
            'title' => $title,
            'body' => $body,
            'icon' => '/icons/icon-192.png',
            'badge' => '/icons/icon-192.png',
            'url' => $url,
            'tag' => 'broadcast-' . time(),
            'timestamp' => now()->timestamp,
        ], $extraData);

        $results = [];
        $successCount = 0;
        
        foreach ($subscriptions as $sub) {
            $result = $webPush->send($sub->toWebPushArray(), $payload);
            $results[] = $result;

            if ($result['success']) {
                $sub->markAsUsed();
                $successCount++;
            } else {
                $sub->deactivate();
            }
        }

        return [
            'sent' => $successCount > 0,
            'success_count' => $successCount,
            'total_count' => $subscriptions->count(),
            'results' => $results
        ];
    }
}
