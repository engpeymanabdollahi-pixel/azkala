import { ProductCard } from '@/components/features/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Search, Smartphone, Package, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
import type { LayoutMode, FilterMode } from '../types';
import type { UserDevice } from '../types';

interface ProductGridProps {
  products: Product[];
  layoutMode: LayoutMode;
  filterMode: FilterMode;
  searchQuery: string;
  userDevices: UserDevice[];
  selectedDeviceIds: number[];
  selectedModelName?: string;
  activeFiltersCount: number;
  onViewProduct: (product: Product) => void;
  onResetFilters: () => void;
  onSelectAllDevices: () => void;
  onChangeFilterMode: (mode: FilterMode) => void;
}

/**
 * نمایش گرید یا لیست محصولات
 */
export function ProductGrid({
  products,
  layoutMode,
  filterMode,
  searchQuery,
  userDevices,
  selectedDeviceIds,
  selectedModelName,
  activeFiltersCount,
  onViewProduct,
  onResetFilters,
  onSelectAllDevices,
  onChangeFilterMode,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={
          filterMode === 'my-devices' && (userDevices.length === 0 || selectedDeviceIds.length === 0) ? (
            <Smartphone className="w-12 h-12" />
          ) : (
            <Search className="w-12 h-12" />
          )
        }
        title={
          filterMode === 'my-devices' && userDevices.length === 0
            ? 'دستگاهی ثبت نکرده‌اید'
            : filterMode === 'my-devices' && selectedDeviceIds.length === 0
            ? 'دستگاهی انتخاب نشده است'
            : filterMode === 'header-device' && selectedModelName
            ? `محصول سازگار با ${selectedModelName} یافت نشد`
            : searchQuery
            ? 'نتیجه‌ای یافت نشد'
            : 'محصولی موجود نیست'
        }
        description={
          filterMode === 'my-devices' && userDevices.length === 0
            ? 'ابتدا دستگاه‌های خود را در داشبورد ثبت کنید'
            : filterMode === 'my-devices' && selectedDeviceIds.length === 0
            ? 'لطفاً حداقل یک دستگاه را انتخاب کنید'
            : filterMode === 'header-device'
            ? 'به زودی محصولات بیشتری اضافه می‌شود'
            : searchQuery
            ? 'کلمات کلیدی دیگری را امتحان کنید'
            : 'فیلترها را تغییر دهید'
        }
        action={
          filterMode === 'my-devices' && userDevices.length === 0 ? null : 
          filterMode === 'my-devices' && selectedDeviceIds.length === 0 ? (
            <Button onClick={onSelectAllDevices} size="md">
              انتخاب همه دستگاه‌ها
            </Button>
          ) : activeFiltersCount > 0 ? (
            <Button onClick={onResetFilters} variant="outline" size="md">
              <X className="w-4 h-4 ml-1.5" />
              پاک کردن فیلترها
            </Button>
          ) : (
            <Button onClick={() => onChangeFilterMode('all')} variant="outline" size="md">
              <Package className="w-4 h-4 ml-1.5" />
              نمایش همه محصولات
            </Button>
          )
        }
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          'gap-3',
          layoutMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'flex flex-col'
        )}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onViewProduct(product)}
            variant={layoutMode}
            index={index}
          />
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          نمایش <span className="font-bold text-gray-900 dark:text-gray-100">{products.length}</span> محصول
        </p>
      </div>
    </>
  );
}
export default ProductGrid;
