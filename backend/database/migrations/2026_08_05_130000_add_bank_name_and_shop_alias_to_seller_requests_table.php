<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ✅ کشف جدی‌تر از حد انتظار: فرم مدارک (مرحله ۲ درخواست فروشندگی) از قبل
 * bank_account را از کاربر می‌گرفت و در SellerRequestService::uploadDocuments
 * به‌عنوان mass-assignment ارسال می‌کرد — ولی نه در $fillable مدل بود و نه
 * اصلاً چنین ستونی روی جدول seller_requests وجود داشت! یعنی شماره حساب
 * بانکی هر فروشنده‌ای که تا امروز مدارک آپلود کرده، بی‌صدا گم شده بود.
 * bank_name و shop_alias (نام مستعار برای آدرس عمومی /seller/:slug) هم
 * هیچ‌وقت اصلاً از کاربر پرسیده نمی‌شدند. این مایگریشن هر سه ستون واقعی را
 * اضافه می‌کند تا فاز بعدی بتواند finalApproveRequest را طوری اصلاح کند که
 * این اطلاعات را واقعاً به User (که ستون‌های bank_name/bank_account/slug
 * را از قبل دارد) منتقل کند.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('seller_requests', 'bank_account')) {
                $table->string('bank_account')->nullable()->after('business_license_image');
            }
            if (!Schema::hasColumn('seller_requests', 'bank_name')) {
                $table->string('bank_name')->nullable()->after('bank_account');
            }
            if (!Schema::hasColumn('seller_requests', 'shop_alias')) {
                $table->string('shop_alias')->nullable()->after('shop_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            foreach (['bank_account', 'bank_name', 'shop_alias'] as $column) {
                if (Schema::hasColumn('seller_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
