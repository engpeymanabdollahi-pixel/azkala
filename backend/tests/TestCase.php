<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function tearDown(): void
    {
        // پاکسازی اجباری تراکنش‌های باز برای جلوگیری از اثر دومینویی در SQLite
        try {
            $pdo = DB::connection()->getPdo();
            if ($pdo && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
        } catch (\Exception $e) {
            // نادیده گرفتن خطاهای پاکسازی
        }

        parent::tearDown();
    }
}