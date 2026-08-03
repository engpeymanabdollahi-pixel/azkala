import { Truck } from 'lucide-react';
import { formatPrice } from '@/utils/format';

interface FreeShippingProgressProps {
  currentTotal: number;
  threshold?: number;
}

export function FreeShippingProgress({ currentTotal, threshold = 500000 }: FreeShippingProgressProps) {
  const remaining = Math.max(0, threshold - currentTotal);
  const progress = Math.min(100, (currentTotal / threshold) * 100);
  const isQualified = remaining === 0;

  if (isQualified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
        <div className="bg-green-100 p-2 rounded-full">
          <Truck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-800">تبریک! سفارش شما شامل ارسال رایگان می‌شود.</p>
          <p className="text-xs text-green-600 mt-1">بسته‌بندی رایگان و ارسال سریع</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">ارسال رایگان</span>
        </div>
        <span className="text-xs font-bold text-blue-700">
          {formatPrice(remaining)} تومان تا ارسال رایگان
        </span>
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-xs text-blue-600 mt-2 text-center">
        با افزودن محصولات بیشتر، هزینه ارسال را صرفه‌جویی کنید!
      </p>
    </div>
  );
}