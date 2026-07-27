<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    // ✅ در لاراول ۱۱، استفاده از CreatesApplication حذف شده است.

    protected function tearDown(): void
    {
        // ✅ بستن اجباری تمام تراکنش‌های باز برای جلوگیری از خطای "already an active transaction" در SQLite
        while (DB::connection()->transactionLevel() > 0) {
            try {
                DB::rollBack();
            } catch (\Exception $e) {
                // اگر به هر دلیلی تراکنشی وجود نداشت، حلقه را بشکن
                break;
            }
        }

        parent::tearDown();
    }
}