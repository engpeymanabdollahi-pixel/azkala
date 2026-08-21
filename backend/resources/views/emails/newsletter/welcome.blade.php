<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خوش آمدید به خبرنامه ازکالا</title>
    <style>
        body { font-family: 'Vazirmatn', Tahoma, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .btn { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 به خبرنامه ازکالا خوش آمدید</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; line-height: 1.8; color: #374151;">
                سلام {{ $subscriber->user->name ?? $subscriber->email }}!
            </p>
            <p style="font-size: 16px; line-height: 1.8; color: #374151;">
                از اینکه به خبرنامه ازکالا پیوستید، ممنونیم! از این پس آخرین تخفیف‌ها، محصولات جدید و راهنمای خرید را مستقیماً در ایمیل خود دریافت خواهید کرد.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{ url('/products') }}" class="btn">
                    مشاهده محصولات
                </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                برای مدیریت اشتراک خبرنامه، به 
                <a href="{{ url('/profile') }}" style="color: #6366f1;">
                    پروفایل خود
                </a>
                مراجعه کنید.
            </p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} ازکالا - تمام حقوق محفوظ است</p>
        </div>
    </div>
</body>
</html>