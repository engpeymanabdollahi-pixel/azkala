<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->text('comment');
            $table->tinyInteger('rating'); // 1 تا 5
            $table->boolean('is_verified')->default(false); // آیا خریدار است؟
            $table->integer('helpful_count')->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->json('images')->nullable();
            $table->timestamps();

            // هر کاربر فقط یک نظر برای هر محصول
            $table->unique(['user_id', 'product_id']);
            
            // ایندکس برای performance
            $table->index(['product_id', 'status']);
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};