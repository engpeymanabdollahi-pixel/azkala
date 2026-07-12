<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Tahoma', sans-serif;
            font-size: 14px;
            direction: rtl;
        }
        h1 {
            text-align: center;
            color: #14b8a6;
            margin-bottom: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%);
            border: 2px solid #14b8a6;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #14b8a6;
            margin: 10px 0;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    
    <div style="text-align: center; margin-bottom: 30px;">
        <strong>بازه زمانی:</strong> {{ $period }} روز اخیر<br>
        <strong>تاریخ گزارش:</strong> {{ now()->format('Y-m-d H:i') }}
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">کل سفارشات</div>
            <div class="stat-value">{{ number_format($stats['total_orders']) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">درآمد کل</div>
            <div class="stat-value">{{ number_format($stats['total_revenue']) }} تومان</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">کاربران جدید</div>
            <div class="stat-value">{{ number_format($stats['total_users']) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">کل محصولات</div>
            <div class="stat-value">{{ number_format($stats['total_products']) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">مکالمات چت</div>
            <div class="stat-value">{{ number_format($stats['total_conversations']) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">پیام‌های ارسالی</div>
            <div class="stat-value">{{ number_format($stats['total_messages']) }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">گزارش‌های تخلف</div>
            <div class="stat-value">{{ number_format($stats['total_reports']) }}</div>
        </div>
    </div>

    <div class="footer">
        <p>گزارش تولید شده توسط سیستم ازکالا</p>
        <p>تاریخ: {{ now()->format('Y-m-d H:i:s') }}</p>
    </div>
</body>
</html>