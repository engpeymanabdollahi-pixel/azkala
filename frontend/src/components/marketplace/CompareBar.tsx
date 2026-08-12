import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, Scale, Trash2 } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/formatPrice';

export function CompareBar() {
  const navigate = useNavigate();
  const { products, removeProduct, clearAll, maxProducts } = useCompareStore();

  if (products.length === 0) return null;

  const canCompare = products.length >= 2;
  const slotsRemaining = maxProducts - products.length;

  const handleCompare = () => {
    if (canCompare) {
      navigate('/compare');
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-primary-200 dark:border-primary-800 shadow-2xl"
      style={{ zIndex: 50 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          
          {/* آیکن و عنوان */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                مقایسه محصولات
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {products.length} از {maxProducts} انتخاب شده
              </p>
            </div>
          </div>

          {/* محصولات انتخاب شده */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative flex-shrink-0 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SafeImage
                    src={product.main_image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    fallbackEmoji="📦"
                  />
                </div>
                
                {/* دکمه حذف */}
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 hover:bg-error-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                  aria-label={`حذف ${product.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* نام محصول (tooltip) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap max-w-[200px] truncate">
                    {product.name}
                  </div>
                </div>
              </div>
            ))}

            {/* اسلات‌های خالی */}
            {Array.from({ length: slotsRemaining }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0"
              >
                <span className="text-gray-400 dark:text-gray-500 text-2xl">+</span>
              </div>
            ))}
          </div>

          {/* دکمه‌های اکشن */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {products.length > 0 && (
              <button
                onClick={clearAll}
                className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                aria-label="پاک کردن همه"
                title="پاک کردن همه"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={handleCompare}
              disabled={!canCompare}
              className={`
                px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2
                ${canCompare
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Scale className="w-4 h-4" />
              <span>مقایسه کن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}