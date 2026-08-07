<?php

namespace App\Services;

use Illuminate\Mail\Mailer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;

/**
 * سرویس ارسال ایمیل
 * 
 * پشتیبانی از قالب‌های Blade و ارسال به صورت صف
 */
class EmailService
{
    protected Mailer $mailer;

    public function __construct(Mailer $mailer)
    {
        $this->mailer = $mailer;
    }

    /**
     * ارسال ایمیل ساده
     *
     * @param string $to آدرس ایمیل گیرنده
     * @param string $subject موضوع ایمیل
     * @param string $view نام ویوی Blade برای قالب ایمیل
     * @param array $data داده‌های ارسالی به ویو
     * @param array $attachments فایل‌های پیوست (اختیاری)
     * @return bool نتیجه عملیات
     */
    public function send(
        string $to,
        string $subject,
        string $view,
        array $data = [],
        array $attachments = []
    ): bool {
        try {
            // بررسی تنظیمات SMTP
            if (!$this->isSmtpConfigured()) {
                Log::warning('SMTP تنظیم نشده است، ایمیل لاگ می‌شود', [
                    'to' => $to,
                    'subject' => $subject,
                ]);
                
                return $this->logEmail($to, $subject, $view, $data);
            }

            $fromAddress = config('mail.from.address', 'noreply@azkala.com');
            $fromName = config('mail.from.name', 'ازکالا');

            $message = $this->mailer->send(
                $view,
                $data,
                function ($message) use ($to, $subject, $fromAddress, $fromName, $attachments) {
                    $message->to($to)
                        ->subject($subject)
                        ->from($fromAddress, $fromName);

                    foreach ($attachments as $attachment) {
                        if (is_string($attachment)) {
                            $message->attach($attachment);
                        } elseif (is_array($attachment) && isset($attachment['path'])) {
                            $message->attach(
                                $attachment['path'],
                                ['as' => $attachment['as'] ?? null]
                            );
                        }
                    }
                }
            );

            Log::info('ایمیل با موفقیت ارسال شد', [
                'to' => $to,
                'subject' => $subject,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('خطا در ارسال ایمیل', [
                'to' => $to,
                'subject' => $subject,
                'exception' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * ارسال ایمیل به چندین گیرنده
     *
     * @param array $recipients آرایه‌ای از آدرس‌های ایمیل
     * @param string $subject موضوع ایمیل
     * @param string $view نام ویوی Blade
     * @param array $data داده‌های ارسالی به ویو
     * @return int تعداد ایمیل‌های موفق
     */
    public function sendBulk(
        array $recipients,
        string $subject,
        string $view,
        array $data = []
    ): int {
        $successCount = 0;

        foreach ($recipients as $recipient) {
            if ($this->send($recipient, $subject, $view, $data)) {
                $successCount++;
            }

            // جلوگیری از Rate Limit
            usleep(200000); // 200ms تأخیر
        }

        return $successCount;
    }

    /**
     * ارسال ایمیل تأیید سفارش به مشتری
     *
     * @param string $email ایمیل مشتری
     * @param \App\Models\Order $order مدل سفارش
     * @return bool نتیجه عملیات
     */
    public function sendOrderConfirmation(string $email, object $order): bool
    {
        return $this->send(
            $email,
            'تأیید ثبت سفارش - #' . $order->order_number,
            'emails.order-confirmation',
            [
                'order' => $order,
                'orderNumber' => $order->order_number,
                'totalAmount' => $order->total_amount,
                'items' => $order->items,
            ]
        );
    }

    /**
     * ارسال ایمیل اطلاع‌رسانی سفارش جدید به فروشنده
     *
     * @param string $email ایمیل فروشنده
     * @param \App\Models\Order $order مدل سفارش
     * @return bool نتیجه عملیات
     */
    public function sendSellerNotification(string $email, object $order): bool
    {
        return $this->send(
            $email,
            'سفارش جدید دریافت شد - #' . $order->order_number,
            'emails.seller-new-order',
            [
                'order' => $order,
                'orderNumber' => $order->order_number,
                'items' => $order->items->where('seller_id', $order->seller_id ?? null),
            ]
        );
    }

    /**
     * ارسال ایمیل بازیابی رمز عبور
     *
     * @param string $email ایمیل کاربر
     * @param string $token توکن بازیابی
     * @return bool نتیجه عملیات
     */
    public function sendPasswordReset(string $email, string $token): bool
    {
        $resetUrl = url('/reset-password?token=' . $token);

        return $this->send(
            $email,
            'بازیابی رمز عبور - ازکالا',
            'emails.password-reset',
            [
                'token' => $token,
                'resetUrl' => $resetUrl,
                'expiresIn' => config('auth.passwords.users.expire', 60),
            ]
        );
    }

    /**
     * ارسال ایمیل خوش‌آمدگویی
     *
     * @param string $email ایمیل کاربر
     * @param string $name نام کاربر
     * @return bool نتیجه عملیات
     */
    public function sendWelcome(string $email, string $name): bool
    {
        return $this->send(
            $email,
            'به ازکالا خوش آمدید',
            'emails.welcome',
            [
                'name' => $name,
                'loginUrl' => url('/login'),
            ]
        );
    }

    /**
     * بررسی پیکربندی SMTP
     */
    private function isSmtpConfigured(): bool
    {
        $mailer = config('mail.mailer', 'smtp');
        $host = config('mail.host');
        
        return $mailer === 'smtp' && !empty($host) && $host !== '127.0.0.1';
    }

    /**
     * لاگ کردن ایمیل (برای محیط توسعه و تست)
     */
    private function logEmail(string $to, string $subject, string $view, array $data): bool
    {
        Log::channel('daily')->info('[EMAIL LOG] ایمیل ارسال شد (شبیه‌سازی)', [
            'to' => $to,
            'subject' => $subject,
            'view' => $view,
            'data_keys' => array_keys($data),
        ]);

        return true;
    }
}
