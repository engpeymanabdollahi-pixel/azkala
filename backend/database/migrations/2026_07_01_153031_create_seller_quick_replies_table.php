<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_quick_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->string('title', 50);
            $table->text('content');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['seller_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_quick_replies');
    }
};