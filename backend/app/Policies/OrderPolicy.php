<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * تعیین اینکه آیا کاربر می‌تواند سفارش را مشاهده کند
     */
    public function view(User $user, Order $order): bool
    {
        // ادمین همه چیز را می‌بیند، کاربر عادی فقط سفارش‌های خودش را
        return $user->role === 'admin' || $user->id === $order->user_id;
    }

    /**
     * تعیین اینکه آیا کاربر می‌تواند سفارش را لغو کند
     */
    public function cancel(User $user, Order $order): bool
    {
        // فقط صاحب سفارش می‌تواند آن را لغو کند
        if ($user->id !== $order->user_id) {
            return false;
        }

        // سفارش‌های ارسال شده یا تحویل داده شده قابل لغو نیستند
        if (in_array($order->status, ['shipped', 'delivered'])) {
            return false;
        }

        return true;
    }

    /**
     * تعیین اینکه آیا کاربر می‌تواند وضعیت سفارش را تغییر دهد (مخصوص ادمین)
     */
    public function updateStatus(User $user, Order $order): bool
    {
        return $user->role === 'admin';
    }
}