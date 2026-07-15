 view /workspace/backend/tests/TestCase.php
view /workspace/backend/tests/TestCase.php
Here's the result of running `cat -n` on /workspace/backend/tests/TestCase.php:
     1	<?php
     2	
     3	namespace Tests;
     4	
     5	use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
     6	use Illuminate\Support\Facades\DB;
     7	
     8	abstract class TestCase extends BaseTestCase
     9	{
    10	    protected function tearDown(): void
    11	    {
    12	        // پاکسازی اجباری تراکنش‌ها برای جلوگیری از خطای دومینویی در SQLite
    13	        try {
    14	            $pdo = DB::connection()->getPdo();
    15	            if ($pdo && $pdo->inTransaction()) {
    16	                $pdo->rollBack();
    17	            }
    18	        } catch (\Exception $e) {
    19	            // نادیده گرفتن خطاهای احتمالی در حین پاکسازی
    20	        }
    21	
    22	        parent::tearDown();
    23	    }
    24	}