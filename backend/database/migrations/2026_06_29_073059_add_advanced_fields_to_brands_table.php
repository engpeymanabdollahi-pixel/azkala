<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            // Country & Website
            $table->string('country', 100)->nullable()->after('description');
            $table->string('website', 255)->nullable()->after('country');
            $table->integer('founded_year')->nullable()->after('website');
            
            // Featured & Verification
            $table->boolean('is_featured')->default(false)->after('founded_year');
            $table->timestamp('verified_at')->nullable()->after('is_featured');
            $table->enum('verification_badge', ['none', 'gold', 'platinum', 'diamond'])->default('none')->after('verified_at');
            
            // SEO
            $table->string('meta_title', 200)->nullable()->after('verification_badge');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('meta_keywords', 255)->nullable()->after('meta_description');
            
            // Social Media (JSON)
            $table->json('social_media')->nullable()->after('meta_keywords');
            
            // Gallery
            $table->json('gallery')->nullable()->after('social_media');
            
            // Branding Colors
            $table->string('primary_color', 20)->nullable()->after('gallery');
            $table->string('secondary_color', 20)->nullable()->after('primary_color');
            
            // Display
            $table->integer('sort_order')->default(0)->after('secondary_color');
            
            // Statistics (cached)
            $table->integer('products_count')->default(0)->after('sort_order');
            $table->integer('models_count')->default(0)->after('products_count');
            $table->integer('series_count')->default(0)->after('models_count');
            $table->decimal('rating', 3, 2)->default(0)->after('series_count');
            $table->integer('reviews_count')->default(0)->after('rating');
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn([
                'country', 'website', 'founded_year', 'is_featured',
                'verified_at', 'verification_badge', 'meta_title',
                'meta_description', 'meta_keywords', 'social_media',
                'gallery', 'primary_color', 'secondary_color',
                'sort_order', 'products_count', 'models_count',
                'series_count', 'rating', 'reviews_count',
            ]);
        });
    }
};