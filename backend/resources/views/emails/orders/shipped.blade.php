<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سفارش ارسال شد - {{ config('app.name') }}</title>
    <style>
        body {
            font-family: Tahoma, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
        }
        .success-box {
            background-color: #dcfce7;
            border: 1px solid #86efac;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .order-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .tracking-box {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .tracking-code {
            font-size: 24px;
            font-weight: bold;
            font-family: monospace;
            letter-spacing: 2px;
            margin: 10px 0;
            padding: 10px;
            background-color: rgba(255,255,255,0.2);
            border-radius: 6px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
        .timeline {
            margin: 25px 0;
            padding: 0;
            list-style: none;
        }
        .timeline li {
            position: relative;
            padding-right: 30px;
            margin-bottom: 15px;
        }
        .timeline li:before {
            content: '✓';
            position: absolute;
            right: 0;
            color: #16a34a;
            font-weight: bold;
        }
        .timeline li.pending {
            opacity: 0.5;
        }
        .timeline li.pending:before {
            content: '○';
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
        </div>

        <div class="success-box">
            <div class="success-icon">🚚</div>
            <h2>سفارش شما ارسال شد!</h2>
            <p>مژده! بسته‌ی شما در راه است.</p>
        </div>

        <p>کاربر گرامی،</p>
        <p>سفارش شما با موفقیت بسته‌بندی و به شرکت پست تحویل داده شد.</p>

        <div class="order-info">
            <div><strong>شماره سفارش:</strong> {{ $order->order_number }}</div>
            <div style="margin-top: 8px;"><strong>تاریخ ارسال:</strong> {{ now()->format('Y/m/d H:i') }}</div>
        </div>

        <div class="tracking-box">
            <div>کد پیگیری مرسوله</div>
            <div class="tracking-code">{{ $trackingCode ?? 'در حال ثبت' }}</div>
            <div style="font-size: 14px; opacity: 0.9;">می‌توانید وضعیت مرسوله را از طریق سایت پست پیگیری کنید</div>
        </div>

        <h3>مراحل تحویل سفارش:</h3>
        <ul class="timeline">
            <li>ثبت سفارش</li>
            <li>تأیید پرداخت</li>
            <li>بررسی و بسته‌بندی توسط فروشنده</li>
            <li>تحویل به شرکت پست ✓</li>
            <li class="pending">در حال انتقال به مقصد</li>
            <li class="pending">تحویل به گیرنده</li>
        </ul>

        <div style="text-align: center;">
            <a href="{{ url('/orders/' . $order->id) }}" class="cta-button">مشاهده جزئیات سفارش</a>
        </div>

        <div class="order-info" style="background-color: #fef3c7; border-color: #fcd34d; margin-top: 20px;">
            <strong>📌 نکته:</strong>
            <p style="margin: 10px 0 0 0; font-size: 14px;">
                لطفاً هنگام دریافت بسته، سلامت آن را بررسی کنید. در صورت مشاهده هرگونه مشکل، حداکثر تا ۲۴ ساعت پس از دریافت، با پشتیبانی تماس بگیرید.
            </p>
        </div>

        <div class="footer">
            <p>در صورت داشتن هرگونه سوال، با پشتیبانی تماس بگیرید.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. تمامی حقوق محفوظ است.</p>
        </div>
    </div>
</body>
</html>
