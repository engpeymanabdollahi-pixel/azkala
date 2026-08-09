import { useState, useEffect, useMemo } from 'react';
import { Bell, BellRing, Package, TrendingDown, Target, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { useAlertApi } from '@/hooks/api/useAlertApi';
import type { Product, AlertType } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface AlertModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PERCENTAGES = [5, 10, 15, 20, 25];

export function AlertModal({ product, isOpen, onClose }: AlertModalProps) {
  const { createAlert, isCreating } = useAlertApi();

  const [selectedType, setSelectedType] = useState<AlertType>('price_drop');
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [isCustomPercentage, setIsCustomPercentage] = useState(false);
  const [customPercentageInput, setCustomPercentageInput] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');

  useEffect(() => {
    if (isOpen && product) {
      const isOutOfStock = product.stock === 0;
      
      if (isOutOfStock) {
        setSelectedType('restock');
      } else {
        setSelectedType('price_drop');
        setDiscountPercentage(10);
        setIsCustomPercentage(false);
        setCustomPercentageInput('');
      }
      setTargetPrice('');
    }
  }, [isOpen, product]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    return product.discount_price || product.price;
  }, [product]);

  const effectiveDiscount = useMemo(() => {
    if (isCustomPercentage) {
      const parsed = parseFloat(customPercentageInput);
      return isNaN(parsed) ? 0 : parsed;
    }
    return discountPercentage;
  }, [isCustomPercentage, customPercentageInput, discountPercentage]);

  const calculatedDiscountedPrice = useMemo(() => {
    if (selectedType !== 'price_drop') return 0;
    return Math.round(currentPrice * (1 - effectiveDiscount / 100));
  }, [currentPrice, effectiveDiscount, selectedType]);

  const calculatedSavings = useMemo(() => {
    return currentPrice - calculatedDiscountedPrice;
  }, [currentPrice, calculatedDiscountedPrice]);

  const parsedTargetPrice = useMemo(() => {
    const parsed = parseInt(targetPrice.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [targetPrice]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (selectedType === 'price_drop') {
      if (effectiveDiscount < 1) {
        errors.push('درصد تخفیف باید حداقل ۱٪ باشد');
      } else if (effectiveDiscount > 99) {
        errors.push('درصد تخفیف نمی‌تواند بیشتر از ۹۹٪ باشد');
      }
    }

    if (selectedType === 'target_price') {
      if (!targetPrice || parsedTargetPrice <= 0) {
        errors.push('قیمت هدف باید وارد شود');
      } else if (parsedTargetPrice >= currentPrice) {
        errors.push('قیمت هدف باید کمتر از قیمت فعلی باشد');
      } else if (parsedTargetPrice < 1000) {
        errors.push('قیمت هدف خیلی کم است');
      }
    }

    return errors;
  }, [selectedType, effectiveDiscount, targetPrice, parsedTargetPrice, currentPrice]);

  const isFormValid = validationErrors.length === 0;

  const handleTargetPriceChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setTargetPrice(numericValue);
  };

  const formatTargetPriceDisplay = (value: string) => {
    if (!value) return '';
    return Number(value).toLocaleString('fa-IR');
  };

  const handleSubmit = () => {
    if (!product || !isFormValid) return;

    const payload: any = {
      product_id: product.id,
      type: selectedType,
      channels: ['database', 'email'],
    };

    if (selectedType === 'price_drop') {
      payload.discount_percentage = effectiveDiscount;
    } else if (selectedType === 'target_price') {
      payload.target_price = parsedTargetPrice;
    }

    createAlert(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!product) return null;

  const isOutOfStock = product.stock === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-black text-gray-900 dark:text-gray-100">
                تنظیم هشدار محصول
              </DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500 dark:text-gray-400">
                به محض تغییر وضعیت، اطلاع می‌دهیم
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Product Info Card */}
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30 border border-primary-200 dark:border-primary-800 rounded-lg p-2.5 flex gap-2.5 mb-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-slate-800 flex-shrink-0 border border-gray-200 dark:border-slate-700">
            <SafeImage
              src={product.main_image}
              alt={product.name}
              className="w-full h-full object-cover"
              fallbackEmoji="📦"
              showEmojiOnError
              aspectRatio="square"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-primary-700 dark:text-primary-400">
                {formatPrice(currentPrice)}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">تومان</span>
            </div>
            {isOutOfStock && (
              <Badge variant="error" size="sm" className="mt-1 text-[10px]">
                ناموجود
              </Badge>
            )}
          </div>
        </div>

        {/* Alert Types */}
        <div className="space-y-1.5 mb-3">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
            نوع هشدار را انتخاب کنید:
          </label>

          {/* Restock Alert */}
          {isOutOfStock && (
            <button
  type="button"
  onClick={() => setSelectedType('restock')}
  className={cn(
    'w-full p-2 rounded-lg border-2 transition-all text-right flex items-start gap-2',
                selectedType === 'restock'
                  ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                selectedType === 'restock'
                  ? 'bg-success-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              )}>
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    موجود شد خبرم کن
                  </span>
                  {selectedType === 'restock' && (
                    <Check className="w-4 h-4 text-success-500" strokeWidth={3} />
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  به محض شارژ مجدد، به شما اطلاع می‌دهیم
                </p>
              </div>
            </button>
          )}

          {/* Price Drop Alert */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={() => setSelectedType('price_drop')}
              className={cn(
                'w-full p-3 rounded-xl border-2 transition-all text-right flex items-start gap-3',
                selectedType === 'price_drop'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                selectedType === 'price_drop'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              )}>
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    کاهش قیمت خبرم کن
                  </span>
                  {selectedType === 'price_drop' && (
                    <Check className="w-4 h-4 text-primary-500" strokeWidth={3} />
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  با رسیدن به درصد تخفیف دلخواه، اطلاع می‌دهیم
                </p>
              </div>
            </button>
          )}

          {/* Target Price Alert */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={() => setSelectedType('target_price')}
              className={cn(
                'w-full p-3 rounded-xl border-2 transition-all text-right flex items-start gap-3',
                selectedType === 'target_price'
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                selectedType === 'target_price'
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              )}>
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    قیمت هدف
                  </span>
                  {selectedType === 'target_price' && (
                    <Check className="w-4 h-4 text-accent-500" strokeWidth={3} />
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  وقتی قیمت به عدد دلخواه شما رسید، اطلاع می‌دهیم
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Discount Percentage Options */}
        {selectedType === 'price_drop' && (
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
              درصد تخفیف:
            </label>

            <div className="grid grid-cols-5 gap-1.5 mb-1.5">
  {PRESET_PERCENTAGES.map((percent) => (
    <button
      key={percent}
      type="button"
      onClick={() => {
        setDiscountPercentage(percent);
        setIsCustomPercentage(false);
        setCustomPercentageInput('');
      }}
      className={cn(
        'py-1.5 rounded-md font-bold text-xs transition-all',
                    !isCustomPercentage && discountPercentage === percent
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  )}
                >
                  {percent}٪
                </button>
              ))}
            </div>

            <button
  type="button"
  onClick={() => setIsCustomPercentage(true)}
  className={cn(
    'w-full py-1.5 rounded-md font-bold text-xs transition-all mb-1.5',
                isCustomPercentage
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              )}
            >
              درصد دلخواه
            </button>

            {isCustomPercentage && (
              <div className="relative">
                <input
                  type="number"
                  value={customPercentageInput}
                  onChange={(e) => setCustomPercentageInput(e.target.value)}
                  placeholder="مثلاً: 30"
                  min="1"
                  max="99"
                  className="w-full px-3 py-2 border-2 border-primary-300 dark:border-primary-700 rounded-md text-center text-base font-bold bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                  autoFocus
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">
                  ٪
                </span>
              </div>
            )}
          </div>
        )}

        {/* Target Price Input */}
        {selectedType === 'target_price' && (
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
              قیمت هدف (تومان):
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatTargetPriceDisplay(targetPrice)}
                onChange={(e) => handleTargetPriceChange(e.target.value)}
                placeholder="مثلاً: 800,000"
                className="w-full px-3 py-2 border-2 border-accent-300 dark:border-accent-700 rounded-md text-base font-bold bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-accent-500 text-left pl-14"
                dir="ltr"
                autoFocus
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold text-sm">
                تومان
              </span>
            </div>
            {targetPrice && parsedTargetPrice > 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                کاهش {formatPrice(currentPrice - parsedTargetPrice)} از قیمت فعلی
                {' '}({Math.round(((currentPrice - parsedTargetPrice) / currentPrice) * 100)}٪)
              </p>
            )}
          </div>
        )}

        {/* Preview Box */}
        {(selectedType === 'price_drop' || selectedType === 'target_price') && (
          <div className="bg-gradient-to-br from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 border border-success-200 dark:border-success-800 rounded-lg p-2.5 mb-3">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-success-600 dark:text-success-400" />
              پیش‌نمایش:
            </h4>
            
            {selectedType === 'price_drop' && effectiveDiscount > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">قیمت با {effectiveDiscount}٪ تخفیف:</span>
                  <span className="font-black text-success-700 dark:text-success-400">
                    {formatPrice(calculatedDiscountedPrice)} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">صرفه‌جویی شما:</span>
                  <Badge variant="success" className="gap-1">
                    <Check className="w-3 h-3" />
                    {formatPrice(calculatedSavings)} تومان
                  </Badge>
                </div>
              </div>
            )}

            {selectedType === 'target_price' && parsedTargetPrice > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">قیمت هدف شما:</span>
                  <span className="font-black text-success-700 dark:text-success-400">
                    {formatPrice(parsedTargetPrice)} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">صرفه‌جویی شما:</span>
                  <Badge variant="success" className="gap-1">
                    <Check className="w-3 h-3" />
                    {formatPrice(currentPrice - parsedTargetPrice)} تومان
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-2.5 mb-3">
            {validationErrors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-error-700 dark:text-error-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Restock Message */}
        {selectedType === 'restock' && (
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-2.5 mb-3">
            <div className="flex items-start gap-2">
              <Package className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-success-700 dark:text-success-400 mb-1">
                  اطلاع‌رسانی از طریق:
                </p>
                <p className="text-[11px] text-success-600 dark:text-success-500">
                  📱 نوتیفیکیشن در سایت و ✉️ ایمیل
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1.5">
                  به محض شارژ مجدد این محصول، فوراً به شما اطلاع می‌دهیم.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-1.5 flex-col sm:flex-row mt-1">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isCreating}
            isLoading={isCreating}
            className="w-full sm:flex-1 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
          >
            {isCreating ? 'در حال ثبت...' : (
              <>
                <Bell className="w-4 h-4 ml-1.5" />
                ثبت هشدار
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}