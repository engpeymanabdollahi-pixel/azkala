<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ListTables extends Command
{
    protected $signature = 'app:tables';
    protected $description = 'List all database tables';

    public function handle()
    {
        $tables = DB::select('SHOW TABLES');
        
        $this->newLine();
        $this->info('📊 همه جداول دیتابیس:');
        $this->newLine();
        
        foreach ($tables as $table) {
            $tableName = array_values((array)$table)[0];
            
            // هایلایت جداول مرتبط با device/phone
            if (str_contains($tableName, 'phone') || 
                str_contains($tableName, 'device') || 
                str_contains($tableName, 'model') || 
                str_contains($tableName, 'series') ||
                str_contains($tableName, 'brand')) {
                $this->line("🔹 <fg=green>{$tableName}</>");
            } else {
                $this->line("   {$tableName}");
            }
        }
        
        $this->newLine();
        $this->info("✅ مجموع: " . count($tables) . " جدول");
        
        return 0;
    }
}