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
        Schema::create('magazine_articles', function (Blueprint $table) {
            $table->id();
            
            // اطلاعات اصلی مقاله
            $table->string('slug', 255)->unique();
            $table->string('title', 500);
            $table->text('excerpt')->nullable(); // خلاصه برای لیست
            $table->longText('content')->nullable(); // محتوای کامل
            
            // تصویر شاخص
            $table->string('featured_image', 500)->nullable();
            
            // منبع اصلی
            $table->string('source_url', 1000)->nullable(); // لینک منبع
            $table->string('source_name', 100)->nullable(); // زومیت، دیجیاتو، ...
            
            // نویسنده
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            
            // دسته‌بندی
            $table->enum('category', ['news', 'review', 'comparison', 'guide', 'rumor'])
                  ->default('news');
            
            // زبان
            $table->string('language', 5)->default('fa');
            
            // آمار
            $table->unsignedInteger('view_count')->default(0);
            
            // زمان‌بندی انتشار
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_published')->default(true);
            
            // نوع محتوا (دستی / RSS / AI)
            $table->enum('content_source', ['admin', 'rss', 'ai_generated'])
                  ->default('rss');
            
            // برای AI Generated (DeepSeek در آینده)
            $table->boolean('is_ai_rewritten')->default(false);
            $table->text('ai_rewrite_prompt')->nullable(); // پرامپت استفاده شده
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index ها برای سرعت
            $table->index('slug');
            $table->index('published_at');
            $table->index('category');
            $table->index(['is_published', 'published_at']);
            
            // ⚠️ fullText حذف شد چون SQLite پشتیبانی نمی‌کند
            // جستجو با LIKE انجام می‌شود که برای حجم فعلی کافی است
            // در صورت مهاجرت به MySQL، می‌توان fullText اضافه کرد
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('magazine_articles');
    }
};