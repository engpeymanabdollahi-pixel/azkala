<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سفارش جدید - {{ config('app.name') }}</title>
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
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .alert-title {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .order-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .order-number {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th {
            background-color: #f3f4f6;
            padding: 10px;
            text-align: right;
            font-weight: bold;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .total {
            text-align: left;
            font-weight: bold;
            font-size: 16px;
            margin-top: 15px;
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
        .seller-note {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            padding: 10px;
            border-radius: 6px;
            margin-top: 15px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
        </div>

        <div class="alert-box">
            <div class="alert-title">📦 سفارش جدید ثبت شد!</div>
            <p>لطفاً هرچه سریع‌تر سفارش را بررسی و تأیید کنید.</p>
        </div>

        <h2>اطلاعات سفارش</h2>

        <div class="order-info">
            <div class="order-number">شماره سفارش: {{ $order->order_number }}</div>
            <div style="margin-top: 10px;">تاریخ ثبت: {{ $order->created_at->format('Y/m/d H:i') }}</div>
            <div>نام خریدار: {{ $order->user->name ?? 'مشتری' }}</div>
            @if($order->user && $order->user->phone)
            <div>شماره تماس: {{ $order->user->phone }}</div>
            @endif
        </div>

        @if($order->items && $order->items->count() > 0)
        <table class="items-table">
            <thead>
                <tr>
                    <th>محصول</th>
                    <th>تعداد</th>
                    <th>قیمت واحد</th>
                    <th>جمع</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->product_name ?? 'محصول' }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format($item->price ?? 0) }} تومان</td>
                    <td>{{ number_format(($item->price ?? 0) * ($item->quantity ?? 1)) }} تومان</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        <div class="total">
            جمع کل سفارش: {{ number_format($order->total_amount ?? 0) }} تومان
        </div>
        @endif

        <div class="seller-note">
            <strong>نکته مهم:</strong> لطفاً پس از بررسی موجودی، وضعیت سفارش را در پنل فروشندگان به‌روزرسانی کنید.
        </div>

        <div style="text-align: center;">
            <a href="{{ url('/seller/orders/' . $order->id) }}" class="cta-button">مدیریت سفارش در پنل فروشندگان</a>
        </div>

        <div class="footer">
            <p>در صورت داشتن هرگونه سوال، با پشتیبانی تماس بگیرید.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. تمامی حقوق محفوظ است.</p>
        </div>
    </div>
</body>
</html>
