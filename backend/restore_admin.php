<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// بازگردانی نقش ادمین
$admin = User::where('phone', '09120000000')->first();

if (!$admin) {
    echo "❌ کاربری با شماره 09120000000 یافت نشد!\n";
    exit;
}

if ($admin->role === 'admin') {
    echo "✅ این کاربر از قبل ادمین است.\n";
    exit;
}

$oldRole = $admin->role;
$admin->update(['role' => 'admin']);

echo "✅ نقش کاربر با موفقیت تغییر کرد!\n";
echo "   نقش قبلی: $oldRole\n";
echo "   نقش جدید: admin\n";
echo "   نام: {$admin->name}\n";
echo "   شماره: {$admin->phone}\n";