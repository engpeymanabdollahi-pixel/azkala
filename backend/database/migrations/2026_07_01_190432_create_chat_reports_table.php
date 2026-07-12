<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('reported_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('conversation_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('message_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('reason', ['spam', 'harassment', 'inappropriate', 'scam', 'other']);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'resolved', 'dismissed'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['reporter_id', 'status']);
            $table->index(['reported_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_reports');
    }
};