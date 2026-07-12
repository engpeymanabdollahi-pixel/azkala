<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class GenerateToken extends Command
{
    protected $signature = 'auth:token {email=test@azkala.ir}';
    
    protected $description = 'Generate Sanctum token for testing';

    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found!");
            return 1;
        }
        
        // حذف توکن‌های قبلی (اختیاری)
        $user->tokens()->delete();
        
        // ساخت توکن جدید
        $token = $user->createToken('test-token')->plainTextToken;
        
        $this->newLine();
        $this->info('✅ Token generated successfully!');
        $this->newLine();
        $this->line("User: <comment>{$user->name}</comment> ({$user->email})");
        $this->line("Role: <comment>{$user->role}</comment>");
        $this->newLine();
        $this->info('🔑 Token:');
        $this->line("<fg=yellow>{$token}</>");
        $this->newLine();
        
        return 0;
    }
}