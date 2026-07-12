import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import type { FilterState } from '../types';
import { DEFAULT_PRICE_RANGE, DEFAULT_MIN_RATING } from '../constants';
import { mockCategories } from '@/data/mockData';

interface FilterTagsProps {
  filters: FilterState;
  onRemoveCategory: () => void;
  onRemovePriceRange: () => void;
  onRemoveMinRating: () => void;
  onRemoveDiscounted: () => void;
  onRemoveInStock: () => void;
}

/**
 * نمایش تگ‌های فیلترهای فعال
 */
export function FilterTags({
  filters,
  onRemoveCategory,
  onRemovePriceRange,
  onRemoveMinRating,
  onRemoveDiscounted,
  onRemoveInStock,
}: FilterTagsProps) {
  const hasPriceFilter =
    filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1];

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
      {filters.selectedCategory !== null && (
        <Badge variant="primary" className="gap-1 cursor-pointer text-[10px]" onClick={onRemoveCategory}>
          {mockCategories.find((c) => c.id === filters.selectedCategory)?.name}
          <X className="w-2.5 h-2.5" />
        </Badge>
      )}
      {hasPriceFilter && (
        <Badge variant="accent" className="gap-1 cursor-pointer text-[10px]" onClick={onRemovePriceRange}>
          {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
          <X className="w-2.5 h-2.5" />
        </Badge>
      )}
      {filters.minRating > DEFAULT_MIN_RATING && (
        <Badge variant="warning" className="gap-1 cursor-pointer text-[10px]" onClick={onRemoveMinRating}>
          امتیاز {filters.minRating}+
          <X className="w-2.5 h-2.5" />
        </Badge>
      )}
      {filters.onlyDiscounted && (
        <Badge variant="error" className="gap-1 cursor-pointer text-[10px]" onClick={onRemoveDiscounted}>
          تخفیف‌دار
          <X className="w-2.5 h-2.5" />
        </Badge>
      )}
      {filters.onlyInStock && (
        <Badge variant="success" className="gap-1 cursor-pointer text-[10px]" onClick={onRemoveInStock}>
          موجود
          <X className="w-2.5 h-2.5" />
        </Badge>
      )}
    </div>
  );
}