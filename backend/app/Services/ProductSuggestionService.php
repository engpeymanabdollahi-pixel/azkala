<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Product;
use App\Models\ProductSuggestion;
use Illuminate\Support\Collection;

class ProductSuggestionService
{
    /**
     * پیشنهاد محصولات مرتبط بر اساس مکالمه
     */
    public function suggestProducts(Conversation $conversation, int $limit = 5): Collection
    {
        $suggestions = collect();

        // ۱. اگر محصولی در مکالمه هست، محصولات مشابه همان فروشنده را پیشنهاد بده
        if ($conversation->product_id) {
            $currentProduct = Product::find($conversation->product_id);
            if ($currentProduct) {
                $similarProducts = Product::where('seller_id', $currentProduct->seller_id)
                    ->where('id', '!=', $currentProduct->id)
                    ->where('is_active', true)
                    ->where('stock', '>', 0)
                    ->where('category_id', $currentProduct->category_id)
                    ->orderByDesc('sales_count')
                    ->limit($limit)
                    ->get();

                foreach ($similarProducts as $product) {
                    $suggestions->push([
                        'product' => $product,
                        'score' => 0.9,
                        'reason' => 'محصولات مشابه از همین فروشنده',
                    ]);
                }
            }
        }

        // ۲. محصولات پرفروش فروشنده
        if ($suggestions->count() < $limit) {
            $topProducts = Product::where('seller_id', $conversation->seller_id)
                ->where('is_active', true)
                ->where('stock', '>', 0)
                ->orderByDesc('sales_count')
                ->limit($limit - $suggestions->count())
                ->get();

            foreach ($topProducts as $product) {
                if (!$suggestions->contains(fn($s) => $s['product']->id === $product->id)) {
                    $suggestions->push([
                        'product' => $product,
                        'score' => 0.7,
                        'reason' => 'محصولات پرفروش',
                    ]);
                }
            }
        }

        // ۳. محصولات جدید فروشنده
        if ($suggestions->count() < $limit) {
            $newProducts = Product::where('seller_id', $conversation->seller_id)
                ->where('is_active', true)
                ->where('stock', '>', 0)
                ->orderByDesc('created_at')
                ->limit($limit - $suggestions->count())
                ->get();

            foreach ($newProducts as $product) {
                if (!$suggestions->contains(fn($s) => $s['product']->id === $product->id)) {
                    $suggestions->push([
                        'product' => $product,
                        'score' => 0.5,
                        'reason' => 'محصولات جدید',
                    ]);
                }
            }
        }

        return $suggestions->take($limit);
    }

    /**
     * ذخیره پیشنهاد محصول
     */
    public function saveSuggestion(
        int $conversationId,
        int $productId,
        int $suggestedBy,
        string $source = 'auto',
        float $relevanceScore = 0.0
    ): ProductSuggestion {
        return ProductSuggestion::create([
            'conversation_id' => $conversationId,
            'product_id' => $productId,
            'suggested_by' => $suggestedBy,
            'source' => $source,
            'relevance_score' => $relevanceScore,
        ]);
    }

    /**
     * علامت‌گذاری کلیک
     */
    public function markAsClicked(int $suggestionId): void
    {
        ProductSuggestion::where('id', $suggestionId)->update(['is_clicked' => true]);
    }

    /**
     * علامت‌گذاری خرید
     */
    public function markAsPurchased(int $suggestionId): void
    {
        ProductSuggestion::where('id', $suggestionId)->update(['is_purchased' => true]);
    }

    /**
     * دریافت آمار پیشنهادات یک فروشنده
     */
    public function getSellerStats(int $sellerId): array
    {
        $suggestions = ProductSuggestion::where('suggested_by', $sellerId)->get();

        return [
            'total' => $suggestions->count(),
            'clicked' => $suggestions->where('is_clicked', true)->count(),
            'purchased' => $suggestions->where('is_purchased', true)->count(),
            'click_rate' => $suggestions->count() > 0 
                ? round(($suggestions->where('is_clicked', true)->count() / $suggestions->count()) * 100, 1) 
                : 0,
            'conversion_rate' => $suggestions->count() > 0 
                ? round(($suggestions->where('is_purchased', true)->count() / $suggestions->count()) * 100, 1) 
                : 0,
        ];
    }
}