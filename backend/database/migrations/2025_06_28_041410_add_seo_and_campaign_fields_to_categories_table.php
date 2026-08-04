<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // SEO Fields
            $table->string('meta_title', 200)->nullable()->after('description');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('meta_keywords', 255)->nullable()->after('meta_description');
            
            // Tags
            $table->json('tags')->nullable()->after('meta_keywords');
            
            // Campaign / Temporary
            $table->boolean('is_temporary')->default(false)->after('tags');
            $table->string('campaign_name', 100)->nullable()->after('is_temporary');
            $table->timestamp('start_date')->nullable()->after('campaign_name');
            $table->timestamp('end_date')->nullable()->after('start_date');
            
            // Visual Customization
            $table->string('bg_color', 20)->nullable()->after('end_date');
            $table->string('text_color', 20)->nullable()->after('bg_color');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn([
                'meta_title', 'meta_description', 'meta_keywords',
                'tags', 'is_temporary', 'campaign_name',
                'start_date', 'end_date', 'bg_color', 'text_color',
            ]);
        });
    }
};