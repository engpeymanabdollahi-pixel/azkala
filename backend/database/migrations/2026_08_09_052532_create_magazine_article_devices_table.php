<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('magazine_article_devices', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('article_id')
                  ->constrained('magazine_articles')
                  ->cascadeOnDelete();
            
            $table->foreignId('device_model_id')
                  ->constrained('device_models')
                  ->cascadeOnDelete();
            
            // میزان ارتباط (هر دستگاه چقدر مرتبط است)
            // مثلاً مقاله اصلی درباره iPhone 15 Pro = 100
            // مقاله مقایسه با iPhone 15 = 80
            $table->unsignedTinyInteger('relevance_score')->default(100);
            
            $table->timestamps();
            
            // یک مقاله فقط یک بار می‌تواند به یک دستگاه مرتبط باشد
            $table->unique(['article_id', 'device_model_id']);
            
            // Index برای query سریع: "همه مقالات این دستگاه"
            $table->index('device_model_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('magazine_article_devices');
    }
};