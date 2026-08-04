<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
        \App\Models\User::whereNotNull('shop_name')->whereNull('slug')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                $user->update(['slug' => Str::slug($user->shop_name)]);
            }
        });
    }

    public function down() {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['slug', 'banner', 'followers_count']);
        });
    }
};