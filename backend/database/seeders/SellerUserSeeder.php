<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SellerUserSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('👤 در حال ساخت کاربران فروشنده تستی...');

        $sellers = [
            ['name' => 'فروشگاه دیجیتال پیمان', 'email' => 'seller1@azkala.com', 'phone' => '09121111111'],
            ['name' => 'موبایل سنتر', 'email' => 'seller2@azkala.com', 'phone' => '09122222222'],
            ['name' => 'تکنولایف', 'email' => 'seller3@azkala.com', 'phone' => '09123333333'],
        ];

        foreach ($sellers as $seller) {
            User::updateOrCreate(
                ['email' => $seller['email']],
                [
                    'name' => $seller['name'],
                    'password' => Hash::make('12345678'),
                    'role' => 'seller',
                    'phone' => $seller['phone'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✅ ۳ کاربر فروشنده ساخته شد (رمز عبور: 12345678)');
    }
}