<?php

namespace Tests\Unit\Models;

use Tests\TestCase;

class DeviceHierarchyScopeTest extends TestCase
{
    public function test_brand_has_many_series_and_models(): void
    {
        $this->markTestSkipped('Device hierarchy tests need database setup');
    }

    public function test_finding_model_by_slug_hierarchy(): void
    {
        $this->markTestSkipped('Device hierarchy tests need database setup');
    }
}