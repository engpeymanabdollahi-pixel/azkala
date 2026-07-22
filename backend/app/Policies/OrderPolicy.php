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
        // ۱. ادمین همه چیز را می‌بیند
        if ($user->role === 'admin') {
            return true;
        }

        // ۲. مشتری فقط سفارش‌های خودش را می‌بیند
        if ($user->role === 'customer' && $user->id === $order->user_id) {
            return true;
        }

        // ۳. فروشنده فقط سفارش‌هایی را می‌بیند که شامل محصولات او هستند
        if ($user->role === 'seller') {
            return $order->items()->where('seller_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * تعیین اینکه آیا کاربر می‌تواند سفارش را لغو کند
     */
    public function cancel(User $user, Order $order): bool
    {
        // فقط مشتری صاحب سفارش می‌تواند آن را لغو کند
        if ($user->role !== 'customer' || $user->id !== $order->user_id) {
            return false;
        }

        // سفارش‌های ارسال شده یا تحویل داده شده قابل لغو نیستند
        if (in_array($order->status, ['shipped', 'delivered', 'cancelled'])) {
            return false;
        }

        return true;
    }

    /**
     * تعیین اینکه آیا کاربر می‌تواند وضعیت سفارش را تغییر دهد
     * (ادمین و فروشنده‌ی مربوطه)
     */
    public function updateStatus(User $user, Order $order): bool
    {
        // ۱. ادمین می‌تواند همه سفارش‌ها را تغییر دهد
        if ($user->role === 'admin') {
            return true;
        }

        // ۲. فروشنده فقط می‌تواند سفارش‌هایی که شامل محصولات او هستند را تغییر دهد
        if ($user->role === 'seller') {
            return $order->items()->where('seller_id', $user->id)->exists();
        }

        // مشتری اجازه تغییر وضعیت ندارد
        return false;
    }

    /**
     * لیست کردن سفارش‌ها (برای SellerOrderController)
     */
    public function viewAny(User $user): bool
    {
        // همه نقش‌ها می‌توانند لیست سفارش‌های خودشان را ببینند
        // (فیلتر کردن سفارش‌ها در کنترلر یا سرویس انجام می‌شود)
        return in_array($user->role, ['admin', 'seller', 'customer']);
    }
}