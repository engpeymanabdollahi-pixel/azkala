<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DescribeProducts extends Command
{
    protected $signature = 'app:describe-products';
    protected $description = 'Describe products table structure';

    public function handle()
    {
        $columns = DB::select('DESCRIBE products');
        
        $this->newLine();
        $this->info('📦 ساختار جدول products:');
        $this->newLine();
        
        foreach ($columns as $column) {
            $this->line("{$column->Field} | {$column->Type} | {$column->Null} | {$column->Default}");
        }
        
        return 0;
    }
}