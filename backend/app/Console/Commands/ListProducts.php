<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;

class ListProducts extends Command
{
    protected $signature = 'app:products';
    protected $description = 'List all products with their slugs';

    public function handle()
    {
        $products = Product::all(['id', 'slug', 'name']);
        
        $this->newLine();
        $this->info('📦 لیست محصولات:');
        $this->newLine();
        
        foreach ($products as $product) {
            $this->line("{$product->id} | {$product->slug} | {$product->name}");
        }
        
        $this->newLine();
        $this->info("✅ مجموع: {$products->count()} محصول");
        
        return 0;
    }
}