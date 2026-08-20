<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductRelationship;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductRelationshipFactory extends Factory
{
    protected $model = ProductRelationship::class;

    public function definition(): array
    {
        return [
            'source_product_id' => Product::factory(),
            'target_product_id' => Product::factory(),
            'type' => ProductRelationship::TYPE_COMPLEMENT,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
