<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خوش آمدید - {{ config('app.name') }}</title>
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
        .welcome-box {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .welcome-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .features {
            margin: 25px 0;
        }
        .feature-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 12px;
            background-color: #f9fafb;
            border-radius: 6px;
        }
        .feature-icon {
            font-size: 24px;
            margin-left: 15px;
        }
        .cta-button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .tip-box {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
        </div>

        <div class="welcome-box">
            <div class="welcome-title">🎉 خوش آمدید، {{ $name ?? 'کاربر گرامی' }}!</div>
            <p>از ثبت‌نام شما در {{ config('app.name') }} سپاسگزاریم.</p>
        </div>

        <p>حساب کاربری شما با موفقیت ایجاد شد. حالا می‌توانید از تمام امکانات پلتفرم ما استفاده کنید.</p>

        <div class="features">
            <h3 style="margin-bottom: 15px;">امکانات پیش روی شما:</h3>
            
            <div class="feature-item">
                <span class="feature-icon">🛍️</span>
                <div>
                    <strong>خرید آسان و امن</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">هزاران محصول متنوع با بهترین قیمت‌ها</p>
                </div>
            </div>

            <div class="feature-item">
                <span class="feature-icon">📦</span>
                <div>
                    <strong>پیگیری سفارشات</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">مشاهده وضعیت سفارشات در هر لحظه</p>
                </div>
            </div>

            <div class="feature-item">
                <span class="feature-icon">💬</span>
                <div>
                    <strong>پشتیبانی ۲۴/۷</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">پاسخگویی سریع به سوالات و مشکلات شما</p>
                </div>
            </div>

            @if(config('azkala.seller_enabled', true))
            <div class="feature-item">
                <span class="feature-icon">🏪</span>
                <div>
                    <strong>فروشندگی</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">ایجاد فروشگاه و فروش محصولات خودتان</p>
                </div>
            </div>
            @endif
        </div>

        <div style="text-align: center;">
            <a href="{{ url('/dashboard') }}" class="cta-button">ورود به پنل کاربری</a>
        </div>

        <div class="tip-box">
            <strong>💡 نکته:</strong> برای شروع، پیشنهاد می‌کنیم پروفایل کاربری خود را تکمیل کنید و علاقه‌مندی‌های خود را مشخص نمایید تا پیشنهادات شخصی‌سازی‌شده دریافت کنید.
        </div>

        <div class="footer">
            <p>در صورت داشتن هرگونه سوال، با پشتیبانی تماس بگیرید.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. تمامی حقوق محفوظ است.</p>
        </div>
    </div>
</body>
</html>
