<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('seller_follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // کاربری که دنبال می‌کند
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade'); // فروشنده (همان user با role=seller)
            $table->timestamps();
            
            $table->unique(['user_id', 'seller_id']);
        });
    }

    public function down() {
        Schema::dropIfExists('seller_follows');
    }
};