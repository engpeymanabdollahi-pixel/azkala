<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class SimpleDebugTest extends TestCase
{
    public function test_it_works(): void
    {
        $this->assertTrue(true);
    }

    public function test_basic_math(): void
    {
        $this->assertEquals(4, 2 + 2);
    }
}