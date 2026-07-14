<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function tearDown(): void
    {
        // ظ¾ط§ع©ط³ط§ط²غŒ ط§ط¬ط¨ط§ط±غŒ طھط±ط§ع©ظ†ط´â€Œظ‡ط§غŒ ط¨ط§ط² ط¨ط±ط§غŒ ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² ط§ط«ط± ط¯ظˆظ…غŒظ†ظˆغŒغŒ ط¯ط± SQLite
        try {
            $pdo = DB::connection()->getPdo();
            if ($pdo && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
        } catch (\Exception $e) {
            // ظ†ط§ط¯غŒط¯ظ‡ ع¯ط±ظپطھظ† ط®ط·ط§ظ‡ط§غŒ ظ¾ط§ع©ط³ط§ط²غŒ
        }

        parent::tearDown();
    }
}