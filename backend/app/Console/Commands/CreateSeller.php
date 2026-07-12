<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CreateSeller extends Command
{
    protected $signature = 'app:create-seller';
    protected $description = 'ساخت کاربر فروشنده تستی و نمایش توکن';

    public function handle()
    {
        $this->info('🏪 ساخت کاربر فروشنده تستی...');
        
        $user = User::firstOrCreate(
            ['email' => 'seller@azkala.ir'],
            [
                'name' => 'فروشنده تست',
                'password' => bcrypt('password123'),
                'phone' => '09121234567',
                'role' => 'seller',
            ]
        );
        
        // پاک کردن توکن‌های قبلی
        $user->tokens()->delete();
        
        // ساخت توکن جدید
        $token = $user->createToken('seller-token')->plainTextToken;
        
        $this->newLine();
        $this->info('✅ کاربر فروشنده ساخته/پیدا شد!');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📧 Email: seller@azkala.ir');
        $this->info('🔑 Password: password123');
        $this->info('🎫 Token: ' . $token);
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return 0;
    }
}