<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Tahoma', sans-serif;
            font-size: 12px;
            direction: rtl;
        }
        h1 {
            text-align: center;
            color: #14b8a6;
            margin-bottom: 20px;
        }
        .header-info {
            background: #f0fdfa;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #14b8a6;
            color: white;
            padding: 8px;
            text-align: right;
        }
        td {
            padding: 6px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    
    <div class="header-info">
        <strong>تاریخ گزارش:</strong> {{ now()->format('Y-m-d H:i') }}<br>
        @if(isset($from_date))
            <strong>از تاریخ:</strong> {{ $from_date }}<br>
        @endif
        @if(isset($to_date))
            <strong>تا تاریخ:</strong> {{ $to_date }}<br>
        @endif
        <strong>تعداد کل:</strong> {{ $orders->count() }} سفارش
    </div>

    <table>
        <thead>
            <tr>
                <th>شماره سفارش</th>
                <th>مشتری</th>
                <th>ایمیل</th>
                <th>مبلغ کل</th>
                <th>وضعیت</th>
                <th>تعداد اقلام</th>
                <th>تاریخ</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
                <tr>
                    <td>{{ $order->order_number }}</td>
                    <td>{{ $order->user->name ?? 'ناشناس' }}</td>
                    <td>{{ $order->user->email ?? '-' }}</td>
                    <td>{{ number_format($order->total) }} تومان</td>
                    <td>
                        @if($order->status === 'pending') در انتظار
                        @elseif($order->status === 'processing') در حال پردازش
                        @elseif($order->status === 'shipped') ارسال شده
                        @elseif($order->status === 'delivered') تحویل شده
                        @elseif($order->status === 'cancelled') لغو شده
                        @endif
                    </td>
                    <td>{{ $order->items->count() }}</td>
                    <td>{{ $order->created_at->format('Y-m-d H:i') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>گزارش تولید شده توسط سیستم ازکالا</p>
        <p>تاریخ: {{ now()->format('Y-m-d H:i:s') }}</p>
    </div>
</body>
</html>