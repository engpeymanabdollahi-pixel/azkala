<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function tearDown(): void
    {
        // ✅ بستن تمام تراکنش‌های باز برای جلوگیری از تداخل بین تست‌ها
        while (DB::connection()->transactionLevel() > 0) {
            try {
                DB::rollBack();
            } catch (\Exception $e) {
                // اگر تراکنشی وجود نداشته باشد، خطا را نادیده بگیر
                break;
            }
        }

        parent::tearDown();
    }
}