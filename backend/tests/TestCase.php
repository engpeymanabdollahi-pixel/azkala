<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    //

    protected function tearDown(): void
    {
        // پاکسازی اجباری تراکنش‌های باز در صورت شکست تست
        \ = \Illuminate\Support\Facades\DB::connection()->getPdo();
        if (\->inTransaction()) {
            \->rollBack();
        }
        
        parent::tearDown();
    }}
