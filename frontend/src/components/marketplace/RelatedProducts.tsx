import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ProductCard } from '@/components/marketplace';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';

/**
 * Props برای RelatedProducts
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 */
export interface RelatedProductsProps {
  /** لیست محصولات مرتبط */
  products: Product[];
  /** عنوان بخش (پیش‌فرض: "محصولات مشابه") */
  title?: string;
  /** لینک "مشاهده همه" (پیش‌فرض: /products) */
  viewAllLink?: string;
  /** تعداد ستون‌ها در grid */
  columns?: {
    mobile?: number;
    tablet?: number;
    laptop?: number;
    desktop?: number;
  };
  /** کلاس اضافی */
  className?: string;
}

/**
 * RelatedProducts - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * قابلیت‌ها:
 * - نمایش grid محصولات مرتبط
 * - عنوان سفارشی
 * - لینک "مشاهده همه"
 * - Responsive grid
 * - RTL + Dark mode
 * - فونت Vazirmatn (font-sans)
 * 
 * مثال:
 * ```tsx
 * // در ProductDetailPage
 * <RelatedProducts products={relatedProducts} />
 * 
 * // در HomePage
 * <RelatedProducts 
 *   products={popularProducts} 
 *   title="محصولات پرفروش"
 *   viewAllLink="/products?sort=popular"
 * />
 * ```
 */
export function RelatedProducts({
  products,
  title = 'محصولات مشابه',
  viewAllLink = '/products',
  columns = { mobile: 2, tablet: 3, laptop: 4, desktop: 6 },
  className,
}: RelatedProductsProps) {
  const navigate = useNavigate();

  // اگر محصولی وجود ندارد، چیزی نمایش نده
  if (products.length === 0) return null;

  return (
    <div className={cn('font-sans', className)}>
      {/* Header: عنوان + مشاهده همه */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 font-sans">
          {title}
        </h2>
        <Link
          to={viewAllLink}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-xs flex items-center gap-1 font-sans"
        >
          مشاهده همه
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Products Grid */}
      <div
        className={cn(
          'grid gap-3',
          `grid-cols-${columns.mobile}`,
          `md:grid-cols-${columns.tablet}`,
          `lg:grid-cols-${columns.laptop}`,
          `xl:grid-cols-${columns.desktop}`
        )}
      >
        {/* ✅ showCompatibility/showSeller/showRating قبلاً اینجا پاس داده
            می‌شدند ولی ProductCardProps چنین prop‌هایی اصلاً ندارد —
            یعنی بی‌اثر بودند و فقط خطای TS تولید می‌کردند. */}
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            variant="grid"
            onClick={() => navigate(`/products/${product.slug}`)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}