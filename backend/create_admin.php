<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// بررسی وجود ادمین با این شماره
$existing = User::where('phone', '09120000000')->first();
if ($existing) {
    echo "⚠️ این شماره از قبل وجود دارد.\n";
    exit;
}

$user = User::create([
    'name' => 'مدیر سیستم',
    'phone' => '09120000000',
    'email' => null, // ✅ اکنون null بودن مشکلی ایجاد نمی‌کند
    'password' => bcrypt('12345678'),
    'role' => 'admin',
    'is_active' => true,
]);

echo "✅ ادمین با موفقیت ساخته شد!\n";
echo "شماره تماس: 09120000000\n";
echo "رمز عبور: 12345678\n";