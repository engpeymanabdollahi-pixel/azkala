<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h2 { text-align: center; margin-bottom: 30px; }
    </style>
</head>
<body>
    <h2>{{ $title }}</h2>
    <table>
        <thead>
            <tr>
                <th>شناسه</th>
                <th>نام</th>
                <th>ایمیل</th>
                <th>تلفن</th>
                <th>نقش</th>
                <th>وضعیت</th>
                <th>تاریخ عضویت</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->id }}</td>
                <td>{{ $user->name }}</td>
                <td>{{ $user->email }}</td>
                <td>{{ $user->phone ?? '-' }}</td>
                <td>
                    @if($user->role === 'customer') مشتری
                    @elseif($user->role === 'seller') فروشنده
                    @elseif($user->role === 'admin') مدیر
                    @else {{ $user->role }}
                    @endif
                </td>
                <td>{{ $user->is_active ? 'فعال' : 'غیرفعال' }}</td>
                <td>{{ \Carbon\Carbon::parse($user->created_at)->format('Y-m-d') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>