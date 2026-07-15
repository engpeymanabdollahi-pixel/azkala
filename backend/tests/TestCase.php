<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function tearDown(): void
    {
        // پاکسازی اجباری تراکنش‌ها برای جلوگیری از خطای دومینویی در SQLite
        try {
            $pdo = DB::connection()->getPdo();
            if ($pdo && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
        } catch (\Exception $e) {
            // نادیده گرفتن خطاهای احتمالی در حین پاکسازی
        }

        parent::tearDown();
    }
}SellerProducts.tsx