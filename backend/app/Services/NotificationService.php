<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

class NotificationService
{
    public function getUserNotifications(int $userId): Collection
    {
        return Notification::where('user_id', $userId)
            ->latest()
            ->limit(20)
            ->get();
    }

    public function markAsRead(int $notificationId, int $userId): void
    {
        $notification = Notification::where('user_id', $userId)
            ->findOrFail($notificationId);

        $notification->update(['read_at' => now()]);
    }

    public function markAllAsRead(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
    public function create(array $data): Notification
{
    return Notification::create([
        'user_id' => $data['user_id'],
        'type' => $data['type'] ?? 'default',
        'title' => $data['title'],
        'message' => $data['message'],
    ]);
}
}
