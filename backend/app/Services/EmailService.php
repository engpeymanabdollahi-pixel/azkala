<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Service for sending email notifications
 */
class EmailService
{
    /**
     * Send an email
     *
     * @param string $email Recipient email address
     * @param string $subject Email subject
     * @param string $view Blade view name
     * @param array $data View data
     * @return bool Success status
     */
    public static function send(string $email, string $subject, string $view, array $data = []): bool
    {
        try {
            Mail::send($view, $data, function ($message) use ($email, $subject) {
                $message->to($email)
                    ->subject($subject)
                    ->from(config('mail.from.address', 'noreply@example.com'), config('mail.from.name', config('app.name')));
            });

            Log::info('Email sent successfully', [
                'email' => $email,
                'subject' => $subject,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Email sending failed', [
                'email' => $email,
                'subject' => $subject,
                'exception' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send order confirmation email to customer
     *
     * @param string $email Customer email
     * @param object $order Order object
     * @return bool Success status
     */
    public static function sendOrderConfirmation(string $email, object $order): bool
    {
        return self::send(
            $email,
            "تأیید سفارش {$order->order_number}",
            'emails.orders.confirmation',
            ['order' => $order]
        );
    }

    /**
     * Send new order notification to seller
     *
     * @param string $email Seller email
     * @param object $order Order object
     * @return bool Success status
     */
    public static function sendSellerNotification(string $email, object $order): bool
    {
        return self::send(
            $email,
            "سفارش جدید: {$order->order_number}",
            'emails.orders.seller_notification',
            ['order' => $order]
        );
    }

    /**
     * Send password reset email
     *
     * @param string $email User email
     * @param string $token Reset token
     * @return bool Success status
     */
    public static function sendPasswordReset(string $email, string $token): bool
    {
        $resetUrl = url("/reset-password/{$token}");
        
        return self::send(
            $email,
            "بازنشانی رمز عبور",
            'emails.auth.password_reset',
            ['token' => $token, 'resetUrl' => $resetUrl]
        );
    }

    /**
     * Send welcome email
     *
     * @param string $email User email
     * @param string $name User name
     * @return bool Success status
     */
    public static function sendWelcome(string $email, string $name): bool
    {
        return self::send(
            $email,
            "خوش آمدید",
            'emails.auth.welcome',
            ['name' => $name]
        );
    }

    /**
     * Send shipping notification email
     *
     * @param string $email Customer email
     * @param object $order Order object
     * @param string $trackingCode Tracking code
     * @return bool Success status
     */
    public static function sendShippingNotification(string $email, object $order, string $trackingCode): bool
    {
        return self::send(
            $email,
            "سفارش شما ارسال شد - {$order->order_number}",
            'emails.orders.shipped',
            ['order' => $order, 'trackingCode' => $trackingCode]
        );
    }
}
