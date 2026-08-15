<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * کد معرف اختصاصی هر کاربر (Referral System — Phase 2).
     *
     * nullable عمداً است: کاربران فعلی (قبل از این migration) کدی ندارند
     * و نباید مجبور به هیچ اقدامی شوند — ReferralService::ensureReferralCode()
     * به‌صورت lazy، در اولین GET /user/referral، برایشان کد می‌سازد.
     * unique برای جلوگیری از collision در سطح دیتابیس (نه فقط اپلیکیشن)،
     * index هم روی همان ستون unique به‌صورت خودکار ساخته می‌شود.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 8)->nullable()->unique()->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('referral_code');
        });
    }
};
