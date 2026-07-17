<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@azkala.com'],
            [
                'name' => 'مدیر سیستم',
                'password' => Hash::make('12345678'),
                'role' => 'admin',
                'phone' => '09120000000',
            ]
        );
        
        $this->command->info('✅ ادمین با موفقیت ساخته یا به‌روزرسانی شد!');
        $this->command->info('ایمیل: admin@azkala.com | رمز: 12345678');
    }
}