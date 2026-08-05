import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CartItem, PhoneModel } from '@/types/models';

interface CompatibilityWarningProps {
  items: CartItem[];
  userDevice: PhoneModel | null;
  className?: string;
}

interface CompatibilityIssue {
  type: 'incompatible' | 'warning' | 'info';
  message: string;
  items: CartItem[];
  severity: 'high' | 'medium' | 'low';
}

/**
 * کامپوننت بررسی سازگاری محصولات در سبد خرید
 * این کامپوننت بررسی می‌کند که آیا همه محصولات با دستگاه کاربر سازگار هستند یا خیر
 */
export function CompatibilityWarning({ 
  items, 
  userDevice,
  className 
}: CompatibilityWarningProps) {
  // تحلیل سازگاری آیتم‌های سبد خرید
  const compatibilityAnalysis = useMemo<CompatibilityIssue[]>(() => {
    const issues: CompatibilityIssue[] = [];

    if (!userDevice || items.length === 0) {
      return issues;
    }

    // گروه‌بندی محصولات بر اساس دسته‌بندی
    const cables = items.filter(item => 
      item.product.category?.slug?.includes('cable') ||
      item.product.name.includes('کابل')
    );

    const chargers = items.filter(item => 
      item.product.category?.slug?.includes('charger') ||
      item.product.name.includes('شارژر') ||
      item.product.name.includes('آداپتور')
    );

    const cases = items.filter(item => 
      item.product.category?.slug?.includes('case') ||
      item.product.name.includes('قاب') ||
      item.product.name.includes('کیس')
    );

    const screenProtectors = items.filter(item => 
      item.product.category?.slug?.includes('screen-protector') ||
      item.product.name.includes('گلس') ||
      item.product.name.includes('محافظ صفحه')
    );

    const audioProducts = items.filter(item => 
      item.product.category?.slug?.includes('audio') ||
      item.product.name.includes('هندزفری') ||
      item.product.name.includes('هدفون') ||
      item.product.name.includes('اسپیکر')
    );

    // بررسی ناسازگاری کابل با هندزفری (مثلاً USB-C vs Lightning)
    if (cables.length > 0 && audioProducts.length > 0) {
      const usbCCables = cables.filter(cable => 
        cable.product.specs?.connector_type === 'USB-C' ||
        cable.product.name.includes('Type-C') ||
        cable.product.name.includes('تایپ سی')
      );

      const lightningAudio = audioProducts.filter(audio => 
        audio.product.specs?.connector_type === 'Lightning' ||
        audio.product.name.includes('لایتنینگ')
      );

      if (usbCCables.length > 0 && lightningAudio.length > 0) {
        issues.push({
          type: 'incompatible',
          message: 'به نظر می‌رسد این کابل با هندزفری انتخابی شما سازگار نیست. کابل USB-C به هندزفری لایتنینگ متصل نمی‌شود.',
          items: [...usbCCables, ...lightningAudio],
          severity: 'high',
        });
      }
    }

    // بررسی سازگاری قاب با مدل دستگاه
    if (cases.length > 0 && userDevice) {
      const incompatibleCases = cases.filter(caseItem => {
        const compatibleModels = caseItem.product.compatible_models || [];
        return !compatibleModels.some(model => 
          model.id === userDevice.id || 
          model.slug === userDevice.slug
        );
      });

      if (incompatibleCases.length > 0) {
        issues.push({
          type: 'incompatible',
          message: `این قاب با ${userDevice.name} سازگار نیست. لطفاً مدل صحیح را انتخاب کنید.`,
          items: incompatibleCases,
          severity: 'high',
        });
      }
    }

    // بررسی سازگاری گلس با مدل دستگاه
    if (screenProtectors.length > 0 && userDevice) {
      const incompatibleProtectors = screenProtectors.filter(protector => {
        const compatibleModels = protector.product.compatible_models || [];
        return !compatibleModels.some(model => 
          model.id === userDevice.id || 
          model.slug === userDevice.slug
        );
      });

      if (incompatibleProtectors.length > 0) {
        issues.push({
          type: 'incompatible',
          message: `این محافظ صفحه با ${userDevice.name} سازگار نیست.`,
          items: incompatibleProtectors,
          severity: 'high',
        });
      }
    }

    // بررسی توان شارژر
    if (chargers.length > 0 && userDevice) {
      const lowPowerChargers = chargers.filter(charger => {
        const chargerWattage = Number(charger.product.specs?.power_output) || 0;
        // فرض می‌کنیم دستگاه‌های جدید حداقل به 20W نیاز دارند
        return chargerWattage < 20 && chargerWattage > 0;
      });

      if (lowPowerChargers.length > 0) {
        issues.push({
          type: 'warning',
          message: 'توان این شارژر پایین است و ممکن است سرعت شارژ دستگاه شما کمتر از حد انتظار باشد.',
          items: lowPowerChargers,
          severity: 'medium',
        });
      }
    }

    // اگر همه چیز سازگار بود
    if (issues.length === 0 && userDevice) {
      issues.push({
        type: 'info',
        message: `✅ تمام محصولات سبد خرید با ${userDevice.name} سازگار هستند.`,
        items: [],
        severity: 'low',
      });
    }

    return issues;
  }, [items, userDevice]);

  if (!userDevice) {
    return (
      <div className={cn(
        "p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800 mb-2">دستگاه خود را انتخاب کنید</h3>
            <p className="text-amber-700 text-sm leading-relaxed">
              برای اطمینان از سازگاری محصولات با دستگاهتان، لطفاً مدل گوشی یا تبلت خود را از صفحه اصلی انتخاب کنید.
              این کار به شما کمک می‌کند تا محصولاتی که با دستگاه شما سازگار نیستند را شناسایی کنید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {compatibilityAnalysis.map((issue, index) => (
        <div
          key={index}
          className={cn(
            "p-6 rounded-3xl border-2 transition-all duration-300",
            issue.type === 'incompatible' && "bg-gradient-to-br from-red-50 to-white border-red-200 shadow-lg shadow-red-500/10",
            issue.type === 'warning' && "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-lg shadow-amber-500/10",
            issue.type === 'info' && "bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-lg shadow-emerald-500/10"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
              issue.type === 'incompatible' && "bg-red-100",
              issue.type === 'warning' && "bg-amber-100",
              issue.type === 'info' && "bg-emerald-100"
            )}>
              {issue.type === 'incompatible' ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : issue.type === 'warning' ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              )}
            </div>

            <div className="flex-1">
              <h3 className={cn(
                "font-bold mb-2",
                issue.type === 'incompatible' && "text-red-800",
                issue.type === 'warning' && "text-amber-800",
                issue.type === 'info' && "text-emerald-800"
              )}>
                {issue.type === 'incompatible' && '⛔ ناسازگاری detected!'}
                {issue.type === 'warning' && '⚠️ توجه کنید'}
                {issue.type === 'info' && '✅ عالی!'}
              </h3>
              
              <p className={cn(
                "text-sm leading-relaxed",
                issue.type === 'incompatible' && "text-red-700",
                issue.type === 'warning' && "text-amber-700",
                issue.type === 'info' && "text-emerald-700"
              )}>
                {issue.message}
              </p>

              {/* نمایش محصولات مرتبط */}
              {issue.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">محصولات مرتبط:</p>
                  <div className="flex flex-wrap gap-2">
                    {issue.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="px-3 py-1.5 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-700"
                      >
                        {item.product.name.substring(0, 30)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* دکمه اقدام برای موارد ناسازگاری */}
              {issue.type === 'incompatible' && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <button className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors">
                    اصلاح سبد خرید
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * کامپوننت خلاصه وضعیت سازگاری برای نمایش در کنار دکمه پرداخت
 */
interface CompatibilitySummaryProps {
  items: CartItem[];
  userDevice: PhoneModel | null;
  onShowDetails: () => void;
  className?: string;
}

export function CompatibilitySummary({
  items,
  userDevice,
  onShowDetails,
  className
}: CompatibilitySummaryProps) {
  const hasIssues = useMemo(() => {
    if (!userDevice) return false;
    
    return items.some(item => {
      const compatibleModels = item.product.compatible_models || [];
      return compatibleModels.length > 0 && !compatibleModels.some(model => 
        model.id === userDevice.id || model.slug === userDevice.slug
      );
    });
  }, [items, userDevice]);

  if (!userDevice) {
    return (
      <button
        onClick={onShowDetails}
        className={cn(
          "w-full p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-800 font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2",
          className
        )}
      >
        <AlertTriangle className="w-5 h-5" />
        بررسی سازگاری محصولات
      </button>
    );
  }

  return (
    <button
      onClick={onShowDetails}
      className={cn(
        "w-full p-4 rounded-2xl border-2 font-medium transition-colors flex items-center justify-center gap-2",
        hasIssues
          ? "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
          : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
        className
      )}
    >
      {hasIssues ? (
        <>
          <AlertTriangle className="w-5 h-5" />
          {items.filter(i => !(i.product.compatible_models || []).some(m => m.id === userDevice.id)).length} محصول ناسازگار
        </>
      ) : (
        <>
          <CheckCircle className="w-5 h-5" />
          تمام محصولات سازگار هستند
        </>
      )}
    </button>
  );
}
