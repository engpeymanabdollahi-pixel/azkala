<?php

namespace Tests\Unit\Services;

use Tests\TestCase;

class CartConsistencyTest extends TestCase
{
    public function test_add_to_cart_throws_exception_if_incompatible(): void
    {
        $this->markTestSkipped('Cart consistency tests need database setup');
    }

    public function test_add_to_cart_succeeds_if_compatible(): void
    {
        $this->markTestSkipped('Cart consistency tests need database setup');
    }
}