import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, X, ShoppingCart, Trash2, CheckCircle, XCircle,
  Scale, Star, Tag, Store, Package, Flame, Award, Sparkles,
} from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/cartStore';
import { DeviceCompatibility } from '@/components/marketplace';
import { useModelStore } from '@/store/modelStore';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

/**
 * ComparePage - صفحه مقایسه محصولات
 *
 * مطابق سند مرجع ازکالا (بخش ۸ Marketplace Components):
 * - CompareBar + CompareTable
 * - فیلدهای Product Card (بخش ۱۱): قیمت، تخفیف، امتیاز، موجودی، فروشنده، سازگاری
 *
 * الگو از Shopify Polaris (بخش ۱۶):
 * - Highlight بهترین قیمت
 * - Toggle "فقط تفاوت‌ها"
 */
export default function ComparePage() {
  const navigate = useNavigate();
  const { products, removeProduct, clearAll, maxProducts } = useCompareStore();
  const { addItem } = useCartStore();
  const { selectedModel } = useModelStore();

  // ✅ فقط تفاوت‌ها - مطابق الگوی Shopify Polaris
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  // ==================== Computed Values ====================

  // کمترین قیمت برای highlight "بهترین قیمت"
  const lowestPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.min(...products.map((p) => p.price));
  }, [products]);

  // بیشترین تخفیف برای highlight "بهترین تخفیف"
  const highestDiscount = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.max(
      ...products.map((p) => {
        if (p.compare_price && p.compare_price > p.price) {
          return Math.round(((p.compare_price - p.price) / p.compare_price) * 100);
        }
        return 0;
      })
    );
  }, [products]);

  // همه کلیدهای specifications
  const allSpecKeys = useMemo(() => {
    return Array.from(new Set(products.flatMap((p) => Object.keys(p.specifications || {}))));
  }, [products]);

  // بررسی تفاوت در یک فیلد specification
  const hasDifference = (key: string): boolean => {
    const values = products.map((p) => p.specifications?.[key] ?? '—');
    return new Set(values).size > 1;
  };

  // فیلتر spec keys بر اساس onlyDifferences
  const visibleSpecKeys = onlyDifferences
    ? allSpecKeys.filter(hasDifference)
    : allSpecKeys;

  // ==================== Handlers ====================

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`${product.name} به سبد خرید اضافه شد`, { icon: '🛒' });
  };

  const calculateDiscount = (product: any): number => {
    if (product.compare_price && product.compare_price > product.price) {
      return Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
    }
    return 0;
  };

  // ==================== Empty State ====================
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            لیست مقایسه خالی است
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            محصولی برای مقایسه انتخاب نکرده‌اید
          </p>
          <Button onClick={() => navigate('/products')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به فروشگاه
          </Button>
        </div>
      </div>
    );
  }

  const gridCols = { gridTemplateColumns: `140px repeat(${products.length}, minmax(200px, 260px))` };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* ==================== Header ==================== */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="بازگشت"
              >
                <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  مقایسه محصولات
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {products.length} از {maxProducts} محصول انتخاب شده
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ Toggle فقط تفاوت‌ها - الگوی Shopify Polaris */}
              <button
                onClick={() => setOnlyDifferences(!onlyDifferences)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
                  onlyDifferences
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-2 border-primary-300 dark:border-primary-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent'
                )}
              >
                <Sparkles className="w-4 h-4" />
                فقط تفاوت‌ها
              </button>

              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="w-4 h-4 ml-2" />
                پاک کردن همه
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== Content ==================== */}
      <div className="container mx-auto px-4 py-6">
        <div className="overflow-x-auto pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 min-w-fit mx-auto">

            {/* ==================== Product Headers ==================== */}
            <div className="grid border-b-2 border-gray-200 dark:border-gray-700" style={gridCols}>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-end">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">محصول</span>
              </div>
              {products.map((product) => {
                const discount = calculateDiscount(product);
                const isLowestPrice = product.price === lowestPrice && products.length > 1;
                const isHighestDiscount = discount === highestDiscount && discount > 0 && products.length > 1;

                return (
                  <div
                    key={product.id}
                    className="p-4 border-r border-gray-100 dark:border-gray-700 last:border-r-0"
                  >
                    <div className="relative">
                      {/* دکمه حذف */}
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-error-500 hover:bg-error-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                        aria-label={`حذف ${product.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* تصویر محصول - اندازه محدود */}
                      <div className="w-full aspect-square max-h-40 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden mb-3 mx-auto max-w-[160px]">
                        <SafeImage
                          src={product.main_image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          fallbackEmoji="📦"
                        />
                      </div>

                      {/* بج‌های بهترین‌ها */}
                      <div className="flex flex-wrap gap-1.5 mb-2 justify-center min-h-[24px]">
                        {isLowestPrice && (
                          <Badge variant="success" className="text-[10px]">
                            <Award className="w-3 h-3 ml-0.5" />
                            بهترین قیمت
                          </Badge>
                        )}
                        {isHighestDiscount && (
                          <Badge variant="error" className="text-[10px]">
                            <Flame className="w-3 h-3 ml-0.5" />
                            بیشترین تخفیف
                          </Badge>
                        )}
                      </div>

                      {/* نام محصول */}
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 text-center text-sm min-h-[40px]">
                        {product.name}
                      </h3>

                      {/* قیمت */}
                      <div className="text-center mb-3">
                        {discount > 0 && product.compare_price && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-through mb-0.5">
                            {formatPrice(product.compare_price)}
                          </p>
                        )}
                        <p className={cn(
                          'text-lg font-black',
                          isLowestPrice ? 'text-success-600 dark:text-success-400' : 'text-primary-600 dark:text-primary-400'
                        )}>
                          {formatPrice(product.price)}
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 mr-1">تومان</span>
                        </p>
                        {discount > 0 && (
                          <Badge variant="error" className="text-[10px] mt-1">
                            {discount}٪ تخفیف
                          </Badge>
                        )}
                      </div>

                      {/* دکمه افزودن به سبد */}
                      <Button
                        onClick={() => handleAddToCart(product)}
                        size="sm"
                        className="w-full"
                      >
                        <ShoppingCart className="w-4 h-4 ml-1.5" />
                        افزودن به سبد
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ==================== ردیف: امتیاز ==================== */}
            <CompareRow label="امتیاز" icon={<Star className="w-4 h-4 text-warning-400" />} style={gridCols}>
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-center gap-1.5">
                  {product.rating && product.rating > 0 ? (
                    <>
                      <Star className="w-4 h-4 text-warning-400 fill-warning-400" />
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {Number(product.rating).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({product.reviews_count || 0})
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
              ))}
            </CompareRow>

            {/* ==================== ردیف: برند ==================== */}
            <CompareRow label="برند" icon={<Tag className="w-4 h-4 text-primary-500" />} style={gridCols} striped>
              {products.map((product) => (
                <div key={product.id} className="text-center">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {(product as any).brand?.name || '—'}
                  </span>
                </div>
              ))}
            </CompareRow>

            {/* ==================== ردیف: دسته‌بندی ==================== */}
            <CompareRow label="دسته‌بندی" icon={<Package className="w-4 h-4 text-accent-500" />} style={gridCols}>
              {products.map((product) => (
                <div key={product.id} className="text-center">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {product.category?.name || '—'}
                  </span>
                </div>
              ))}
            </CompareRow>

            {/* ==================== ردیف: فروشنده ==================== */}
            <CompareRow label="فروشنده" icon={<Store className="w-4 h-4 text-warning-500" />} style={gridCols} striped>
              {products.map((product) => {
                // ✅ TS نمی‌تواند narrow شدن product.seller را داخل کلوژر
                // onClick دنبال کند؛ یک ثابت محلی هم تایپ را درست می‌کند و
                // هم از خواندن دوباره‌ی ملک تو در تو جلوگیری می‌کند.
                const seller = product.seller;
                return (
                <div key={product.id} className="text-center">
                  {seller ? (
                    <button
                      onClick={() => navigate(`/seller/${seller.slug}`)}
                      className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                    >
                      {seller.shop_name}
                    </button>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
                );
              })}
            </CompareRow>

            {/* ==================== ردیف: صرفه‌جویی ==================== */}
            <CompareRow label="میزان صرفه‌جویی" icon={<Sparkles className="w-4 h-4 text-success-500" />} style={gridCols}>
              {products.map((product) => {
                const savings = product.compare_price && product.compare_price > product.price
                  ? product.compare_price - product.price
                  : 0;
                return (
                  <div key={product.id} className="text-center">
                    {savings > 0 ? (
                      <span className="text-sm font-bold text-success-600 dark:text-success-400">
                        {formatPrice(savings)} تومان
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </div>
                );
              })}
            </CompareRow>

            {/* ==================== ردیف: سازگاری با دستگاه انتخابی ==================== */}
            {selectedModel && products.some((p) => p.compatible_models && p.compatible_models.length > 0) && (
              <CompareRow
                label={`سازگاری با ${selectedModel.name}`}
                icon={<CheckCircle className="w-4 h-4 text-success-500" />}
                style={gridCols}
                striped
              >
                {products.map((product) => {
                  const isCompatible = product.compatible_models?.some(
                    (m) => m.id === selectedModel.id
                  );
                  return (
                    <div key={product.id} className="flex items-center justify-center">
                      {isCompatible ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3.5 h-3.5 ml-1" />
                          سازگار
                        </Badge>
                      ) : (
                        <Badge variant="error">
                          <XCircle className="w-3.5 h-3.5 ml-1" />
                          ناسازگار
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </CompareRow>
            )}

            {/* ==================== بخش مشخصات فنی ==================== */}
            {visibleSpecKeys.length > 0 && (
              <>
                <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-3 border-y border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    مشخصات فنی
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({visibleSpecKeys.length} مورد)
                    </span>
                  </h2>
                  {onlyDifferences && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-bold">
                      فقط تفاوت‌ها نمایش داده می‌شود
                    </span>
                  )}
                </div>

                {visibleSpecKeys.map((key, index) => (
                  <div
                    key={key}
                    className={cn(
                      'grid border-b border-gray-100 dark:border-gray-700 last:border-0',
                      index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                    )}
                    style={gridCols}
                  >
                    <div className="p-3 flex items-center">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {key}
                      </span>
                    </div>
                    {products.map((product) => {
                      const value = product.specifications?.[key];
                      const hasValue = value !== undefined && value !== null && value !== '';
                      return (
                        <div
                          key={product.id}
                          className="p-3 border-r border-gray-100 dark:border-gray-700 last:border-r-0 flex items-center justify-center text-center"
                        >
                          {hasValue ? (
                            <span className="text-xs text-gray-900 dark:text-gray-100">{String(value)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {/* ==================== حالت خالی برای تفاوت‌ها ==================== */}
            {onlyDifferences && visibleSpecKeys.length === 0 && allSpecKeys.length > 0 && (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-bold mb-1">
                  همه مشخصات یکسان است!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  این محصولات در مشخصات فنی تفاوتی ندارند
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Sub-component: ردیف مقایسه ====================
interface CompareRowProps {
  label: string;
  icon?: React.ReactNode;
  style: React.CSSProperties;
  striped?: boolean;
  children: React.ReactNode;
}

function CompareRow({ label, icon, style, striped = false, children }: CompareRowProps) {
  const cells = Array.isArray(children) ? children : [children];
  return (
    <div
      className={cn(
        'grid border-b border-gray-100 dark:border-gray-700',
        striped ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
      )}
      style={style}
    >
      <div className="p-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      {cells}
    </div>
  );
}