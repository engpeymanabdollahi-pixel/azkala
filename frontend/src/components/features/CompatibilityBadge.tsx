import { useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, Smartphone, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PhoneModel } from '@/types/models';
import { Badge } from '@/components/ui/Badge';

interface CompatibilityBadgeProps {
  isCompatible: boolean;
  confidence?: number; // 0-100
  deviceName?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

export function CompatibilityBadge({
  isCompatible,
  confidence = 100,
  deviceName,
  message,
  size = 'md',
  showAnimation = true,
  className,
}: CompatibilityBadgeProps) {
  const statusConfig = useMemo(() => {
    if (isCompatible && confidence >= 90) {
      return {
        icon: CheckCircle,
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        iconColor: 'text-emerald-500',
        label: 'سازگار',
        default_message: `این محصول ۱۰۰٪ با ${deviceName || 'دستگاه شما'} سازگار است.`,
        gradient: 'from-emerald-500/10 to-transparent',
      };
    } else if (isCompatible && confidence >= 70) {
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        iconColor: 'text-green-500',
        label: 'سازگار',
        default_message: `این محصول با ${deviceName || 'دستگاه شما'} سازگاری دارد.`,
        gradient: 'from-green-500/10 to-transparent',
      };
    } else if (!isCompatible && confidence < 50) {
      return {
        icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        iconColor: 'text-red-500',
        label: 'ناسازگار',
        default_message: `این محصول با ${deviceName || 'دستگاه شما'} سازگار نیست.`,
        gradient: 'from-red-500/10 to-transparent',
      };
    } else {
      return {
        icon: AlertCircle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        iconColor: 'text-amber-500',
        label: 'بررسی لازم',
        default_message: `سازگاری این محصول با ${deviceName || 'دستگاه شما'} نیاز به بررسی دارد.`,
        gradient: 'from-amber-500/10 to-transparent',
      };
    }
  }, [isCompatible, confidence, deviceName]);

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-3',
  };

  const IconComponent = statusConfig.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-2xl border-2 font-semibold transition-all duration-300',
        statusConfig.bgColor,
        statusConfig.borderColor,
        statusConfig.textColor,
        sizes[size],
        showAnimation && 'animate-in fade-in zoom-in duration-300',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'relative flex-shrink-0',
          showAnimation && 'animate-pulse'
        )}
      >
        <IconComponent className={cn('w-5 h-5 md:w-6 md:h-6', statusConfig.iconColor)} />
        {isCompatible && confidence >= 90 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
        )}
      </div>

      <div className="flex flex-col">
        <span className="font-bold">{statusConfig.label}</span>
        {message || statusConfig.default_message}
      </div>

      {confidence < 100 && isCompatible && (
        <div className="hidden md:flex items-center gap-2 mr-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                confidence >= 90 ? 'bg-emerald-500' : 'bg-green-500'
              )}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-medium">{confidence}%</span>
        </div>
      )}
    </div>
  );
}

// کامپوننت پیشرفته‌تر برای نمایش جعبه سازگاری
interface CompatibilityBoxProps {
  userDevice: PhoneModel | null;
  productCompatibility: {
    isCompatible: boolean;
    confidence: number;
    reasons: string[];
    incompatibleReasons?: string[];
  };
  className?: string;
}

export function CompatibilityBox({
  userDevice,
  productCompatibility,
  className,
}: CompatibilityBoxProps) {
  const { isCompatible, confidence, reasons, incompatibleReasons } = productCompatibility;

  if (!userDevice) {
    return (
      <div className={cn(
        "p-6 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300",
        className
      )}>
        <div className="flex items-center gap-4 text-center">
          <Smartphone className="w-12 h-12 text-gray-400" />
          <div>
            <p className="font-bold text-gray-700 mb-1">دستگاه خود را انتخاب کنید</p>
            <p className="text-sm text-gray-500">
              برای بررسی سازگاری این محصول با دستگاهتان، ابتدا مدل گوشی یا تبلت خود را مشخص کنید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-6 rounded-3xl border-2 transition-all duration-300",
        isCompatible
          ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-lg shadow-emerald-500/10"
          : "bg-gradient-to-br from-red-50 to-white border-red-200 shadow-lg shadow-red-500/10",
        className
      )}
    >
      {/* هدر باکس سازگاری */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
            isCompatible
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30"
              : "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30"
          )}
        >
          {isCompatible ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <XCircle className="w-8 h-8 text-white" />
          )}
        </div>

        <div className="flex-1">
          <h3
            className={cn(
              "text-xl font-black mb-2",
              isCompatible ? "text-emerald-700" : "text-red-700"
            )}
          >
            {isCompatible
              ? `✅ این محصول ۱۰۰٪ با ${userDevice.name} سازگار است.`
              : `❌ این محصول با ${userDevice.name} سازگار نیست.`}
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  confidence >= 90
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : confidence >= 70
                    ? "bg-gradient-to-r from-green-500 to-green-400"
                    : "bg-gradient-to-r from-red-500 to-red-400"
                )}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span
              className={cn(
                "font-bold text-lg",
                isCompatible ? "text-emerald-600" : "text-red-600"
              )}
            >
              {confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* لیست دلایل سازگاری */}
      <div className="space-y-3">
        <p className="font-bold text-gray-700 mb-3">
          {isCompatible ? 'دلایل سازگاری:' : 'دلایل ناسازگاری:'}
        </p>

        {(isCompatible ? reasons : incompatibleReasons || reasons).map((reason, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl",
              isCompatible ? "bg-emerald-50/50" : "bg-red-50/50"
            )}
          >
            {isCompatible ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <span className={cn(
              "text-sm",
              isCompatible ? "text-emerald-800" : "text-red-800"
            )}>
              {reason}
            </span>
          </div>
        ))}
      </div>

      {/* دکمه اقدام */}
      {isCompatible && (
        <div className="mt-6 pt-4 border-t border-emerald-200">
          <button className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5">
            افزودن به سبد خرید با اطمینان از سازگاری
          </button>
        </div>
      )}
    </div>
  );
}
