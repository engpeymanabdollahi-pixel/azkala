<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up() {
        Schema::table('users', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable()->after('name');
            $table->string('banner')->nullable()->after('avatar');
            $table->unsignedInteger('followers_count')->default(0)->after('products_count');
        });

        // تولید slug برای فروشندگان فعلی که shop_name دارند اما slug ندارند
        // ✅ از query builder استفاده می‌کنیم نه مدل Eloquent User، چون این
        // migration باید روی هر نسخه‌ای از جدول users (حتی قبل از ستون‌های
        // بعدی مثل deleted_at) قابل اجرا بمونه؛ مدل Eloquent همیشه آخرین
        // global scope های تعریف‌شده (مثل SoftDeletes) رو اعمال می‌کنه، حتی
        // موقع replay کردن migration های قدیمی روی دیتابیس خالی.
        DB::table('users')->whereNotNull('shop_name')->whereNull('slug')->orderBy('id')->chunk(100, function ($users) {
            foreach ($users as $user) {
                DB::table('users')->where('id', $user->id)->update(['slug' => Str::slug($user->shop_name)]);
            }
        });
    }

    public function down() {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['slug', 'banner', 'followers_count']);
        });
    }
};