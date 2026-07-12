<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DescribePhoneModels extends Command
{
    protected $signature = 'app:describe-phone-models';
    protected $description = 'Describe phone_models table structure';

    public function handle()
    {
        $columns = DB::select('DESCRIBE phone_models');
        
        $this->newLine();
        $this->info('📱 ساختار جدول phone_models:');
        $this->newLine();
        
        foreach ($columns as $column) {
            $this->line("{$column->Field} | {$column->Type} | {$column->Null} | {$column->Default}");
        }
        
        $this->newLine();
        
        // نمایش تعداد رکوردها
        $count = DB::table('phone_models')->count();
        $this->info("✅ تعداد رکوردها: {$count}");
        
        // نمایش ۵ رکورد اول
        if ($count > 0) {
            $this->newLine();
            $this->info('📋 ۵ رکورد اول:');
            $models = DB::table('phone_models')->limit(5)->get();
            foreach ($models as $model) {
                $this->line("  - {$model->name} ({$model->slug})");
            }
        }
        
        return 0;
    }
}