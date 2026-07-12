<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DescribeBrands extends Command
{
    protected $signature = 'app:describe-brands';
    protected $description = 'Describe brands table';

    public function handle()
    {
        $columns = DB::select('DESCRIBE brands');
        
        $this->newLine();
        $this->info('🏷️  ساختار جدول brands:');
        $this->newLine();
        
        foreach ($columns as $column) {
            $this->line("{$column->Field} | {$column->Type}");
        }
        
        return 0;
    }
}