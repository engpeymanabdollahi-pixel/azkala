<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    //

    
    protected function tearDown(): void
    {
        parent::tearDown();
        
        // Force rollback any active transactions to prevent "already an active transaction" errors
        try {
            $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
            if ($pdo && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
        } catch (\Exception $e) {
            // Ignore cleanup errors
        }
    }
}