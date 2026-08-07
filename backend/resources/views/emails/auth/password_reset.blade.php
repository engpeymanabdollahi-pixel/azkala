<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>بازنشانی رمز عبور - {{ config('app.name') }}</title>
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
        .alert-box {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .reset-button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .token-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-family: monospace;
            word-break: break-all;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .warning {
            color: #dc2626;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
        </div>

        <h2>درخواست بازنشانی رمز عبور</h2>

        <p>کاربر گرامی،</p>
        <p>درخواستی برای بازنشانی رمز عبور حساب کاربری شما ثبت شده است.</p>

        <div class="alert-box">
            <strong>توجه:</strong> اگر شما این درخواست را ثبت نکرده‌اید، می‌توانید این ایمیل را نادیده بگیرید. رمز عبور شما تغییر نخواهد کرد.
        </div>

        <p>برای بازنشانی رمز عبور، روی دکمه زیر کلیک کنید:</p>

        <div style="text-align: center;">
            <a href="{{ $resetUrl ?? url('/reset-password/' . $token) }}" class="reset-button">
                🔐 بازنشانی رمز عبور
            </a>
        </div>

        <p>یا از لینک زیر استفاده کنید:</p>
        
        <div class="token-info">
            {{ $resetUrl ?? url('/reset-password/' . $token) }}
        </div>

        <div class="alert-box" style="background-color: #fee2e2; border-color: #fca5a5;">
            <p class="warning">⚠️ نکات امنیتی:</p>
            <ul style="margin: 10px 0; padding-right: 20px;">
                <li>این لینک فقط برای شما معتبر است و نباید آن را با کسی به اشتراک بگذارید.</li>
                <li>لینک بازنشانی رمز عبور پس از {{ config('auth.passwords.users.expire', 60) }} دقیقه منقضی می‌شود.</li>
                <li>پس از بازنشانی موفق، تمام نشست‌های فعال شما خاتمه خواهند یافت.</li>
            </ul>
        </div>

        <div class="footer">
            <p>در صورت داشتن هرگونه سوال، با پشتیبانی تماس بگیرید.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. تمامی حقوق محفوظ است.</p>
        </div>
    </div>
</body>
</html>
