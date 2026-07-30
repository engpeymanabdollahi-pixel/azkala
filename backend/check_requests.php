<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SellerRequest;

$requests = SellerRequest::with('user:id,name,phone,role')->get();

echo "📊 تعداد کل درخواست‌ها: " . $requests->count() . "\n\n";

if ($requests->count() === 0) {
    echo "هیچ درخواستی ثبت نشده است.\n";
    exit;
}

foreach ($requests as $r) {
    echo "🆔 ID: " . $r->id . "\n";
    echo "👤 کاربر: " . ($r->user->name ?? 'حذف شده') . " (" . $r->user->phone . ")\n";
    echo "🏪 نام فروشگاه پیشنهادی: " . $r->shop_name . "\n";
    echo "📌 وضعیت (Status): " . $r->status . "\n";
    echo "📄 کارت ملی: " . ($r->id_card_image ? 'دارد' : 'ندارد') . "\n";
    echo "📄 جواز کسب: " . ($r->business_license_image ? 'دارد' : 'ندارد') . "\n";
    echo "--------------------------------------------------\n";
}