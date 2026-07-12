<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_sentiments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->onDelete('cascade');
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // کاربری که پیام را فرستاده
            $table->enum('sentiment', ['positive', 'negative', 'neutral'])->default('neutral');
            $table->float('score')->default(0.0); // -1.0 تا 1.0
            $table->json('keywords')->nullable(); // کلمات کلیدی شناسایی شده
            $table->timestamps();

            $table->index(['conversation_id', 'sentiment']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_sentiments');
    }
};