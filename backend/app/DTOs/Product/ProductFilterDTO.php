<?php

namespace App\DTOs\Product;

use Illuminate\Http\Request;

class ProductFilterDTO
{
    public function __construct(
        public readonly ?int $category_id = null,
        public readonly ?int $brand_id = null,
        public readonly ?string $search = null,
        public readonly ?float $min_price = null,
        public readonly ?float $max_price = null,
        public readonly string $sort_by = 'created_at',
        public readonly string $sort_order = 'desc',
        public readonly int $per_page = 20,
        // ✅ Marketplace Unification فاز C1: فیلتر device-aware — محصولاتی
        // که حداقل یک مدل دستگاه از این خانواده را پوشش می‌دهند.
        public readonly ?int $device_family_id = null,
    ) {}

    /**
     * Create DTO from Request
     */
    public static function fromRequest(Request $request): self
    {
        return new self(
            category_id: $request->filled('category_id') ? (int) $request->category_id : null,
            brand_id: $request->filled('brand_id') ? (int) $request->brand_id : null,
            search: $request->filled('search') ? $request->search : null,
            min_price: $request->filled('min_price') ? (float) $request->min_price : null,
            max_price: $request->filled('max_price') ? (float) $request->max_price : null,
            sort_by: $request->get('sort_by', 'created_at'),
            sort_order: $request->get('sort_order', 'desc'),
            per_page: (int) $request->get('per_page', 20),
            device_family_id: $request->filled('device_family_id') ? (int) $request->device_family_id : null,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return array_filter([
            'category_id' => $this->category_id,
            'brand_id' => $this->brand_id,
            'search' => $this->search,
            'min_price' => $this->min_price,
            'max_price' => $this->max_price,
            'sort_by' => $this->sort_by,
            'sort_order' => $this->sort_order,
            'device_family_id' => $this->device_family_id,
        ], fn ($value) => $value !== null);
    }
}
