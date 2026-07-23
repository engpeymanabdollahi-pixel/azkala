<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:settle-delivered-orders')]
#[Description('Command description')]
class SettleDeliveredOrders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
