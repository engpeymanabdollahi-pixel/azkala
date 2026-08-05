import { useState, useMemo } from 'react';
import { 
  Zap, Battery, Smartphone, Watch, Laptop, 
  BarChart3, Activity, TrendingUp, Info,
  CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Product, PhoneModel } from '@/types/models';
import { CompatibilityBadge } from './CompatibilityBadge';

interface ProductShowcaseProps {
  product: Product;
  userDevice?: PhoneModel | null;
  className?: string;
}

interface TechSpec {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  visualization?: 'bar' | 'circular' | 'text';
  maxRange?: number;
  color?: string;
}

export function ProductShowcase({ 
  product, 
  userDevice,
  className 
}: ProductShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'compatibility'>('overview');

  // استخراج مشخصات فنی از JSON یا fields محصول
  const techSpecs = useMemo<TechSpec[]>(() => {
    const specs: TechSpec[] = [];

    // مثال برای پاوربانک
    if (product.category?.slug?.includes('power-bank') || product.name.includes('پاوربانک')) {
      specs.push(
        {
          key: 'capacity',
          label: 'ظرفیت باتری',
          value: product.specs?.battery_capacity || 10000,
          unit: 'mAh',
          icon: <Battery className="w-5 h-5" />,
          visualization: 'bar',
          maxRange: 30000,
          color: 'from-blue-500 to-cyan-500',
        },
        {
          key: 'charging_cycles',
          label: 'تعداد دفعات شارژ دستگاه',
          value: Math.floor((Number(product.specs?.battery_capacity) || 10000) / 4000),
          unit: 'بار',
          icon: <Activity className="w-5 h-5" />,
          visualization: 'circular',
          color: 'from-green-500 to-emerald-500',
        },
        {
          key: 'fast_charge',
          label: 'پشتیبانی از شارژ سریع',
          value: product.specs?.fast_charging ? 'دارد' : 'ندارد',
          icon: <Zap className="w-5 h-5" />,
          visualization: 'text',
          color: 'from-yellow-500 to-orange-500',
        }
      );
    }

    // مثال برای کابل
    if (product.category?.slug?.includes('cable') || product.name.includes('کابل')) {
      specs.push(
        {
          key: 'length',
          label: 'طول کابل',
          value: product.specs?.length || 1,
          unit: 'متر',
          icon: <TrendingUp className="w-5 h-5" />,
          visualization: 'bar',
          maxRange: 3,
          color: 'from-purple-500 to-pink-500',
        },
        {
          key: 'data_transfer',
          label: 'سرعت انتقال داده',
          value: product.specs?.data_transfer_speed || '480 Mbps',
          icon: <BarChart3 className="w-5 h-5" />,
          visualization: 'text',
          color: 'from-indigo-500 to-blue-500',
        }
      );
    }

    // مشخصات عمومی
    if (!specs.length) {
      specs.push(
        {
          key: 'weight',
          label: 'وزن',
          value: product.specs?.weight || 0,
          unit: 'گرم',
          icon: <Info className="w-5 h-5" />,
          visualization: 'text',
          color: 'from-gray-500 to-gray-600',
        }
      );
    }

    return specs;
  }, [product]);

  // بررسی سازگاری با دستگاه کاربر
  const compatibilityInfo = useMemo(() => {
    if (!userDevice) {
      return {
        isCompatible: false,
        confidence: 0,
        message: 'دستگاه خود را انتخاب کنید',
      };
    }

    // TODO: منطق واقعی بررسی سازگاری از API
    const compatibleModels = product.compatible_models || [];
    const isCompatible = compatibleModels.some(
      model => model.id === userDevice.id || model.slug === userDevice.slug
    );

    return {
      isCompatible,
      confidence: isCompatible ? 100 : 0,
      message: isCompatible 
        ? `سازگار با ${userDevice.name}`
        : 'بررسی سازگاری...',
    };
  }, [userDevice, product]);

  return (
    <div className={cn("w-full", className)}>
      {/* تب‌های ناوبری */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-6 py-3 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap",
            activeTab === 'overview'
              ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          📋 نمای کلی
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={cn(
            "px-6 py-3 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap",
            activeTab === 'specs'
              ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          ⚙️ مشخصات فنی
        </button>
        <button
          onClick={() => setActiveTab('compatibility')}
          className={cn(
            "px-6 py-3 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap",
            activeTab === 'compatibility'
              ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          ✅ سازگاری
        </button>
      </div>

      {/* محتوای تب‌ها */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* کارت‌های خلاصه مشخصات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techSpecs.slice(0, 4).map((spec) => (
              <div
                key={spec.key}
                className="p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                  spec.color || 'from-gray-400 to-gray-500'
                )}>
                  {spec.icon}
                </div>
                <p className="text-xs text-gray-500 mb-1">{spec.label}</p>
                <p className="text-lg font-black text-gray-800">
                  {spec.value}
                  {spec.unit && <span className="text-xs font-medium text-gray-500 mr-1">{spec.unit}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* توضیحات کوتاه */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-50 to-white border border-primary-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              درباره این محصول
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {product.short_description || product.description || 'توضیحات بیشتری موجود نیست.'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {techSpecs.map((spec) => (
            <div
              key={spec.key}
              className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  spec.color || 'from-gray-400 to-gray-500'
                )}>
                  {spec.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{spec.label}</p>
                  <p className="text-sm text-gray-500">
                    {spec.value} {spec.unit}
                  </p>
                </div>
              </div>

              {/* ویژوالایزیشن */}
              {spec.visualization === 'bar' && spec.maxRange && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>0</span>
                    <span>{spec.maxRange} {spec.unit}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                        spec.color || 'from-primary-500 to-primary-600'
                      )}
                      style={{ width: `${Math.min((Number(spec.value) / spec.maxRange) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {spec.visualization === 'circular' && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-100"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={175.93}
                        strokeDashoffset={175.93 - (175.93 * Math.min(Number(spec.value) / 10, 1))}
                        className={cn("transition-all duration-700", spec.color?.replace('from-', 'text-').split(' ')[0] || 'text-primary-500')}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">{spec.value}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    بر اساس ظرفیت {product.specs?.battery_capacity || 10000} mAh
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'compatibility' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={cn(
              "p-6 rounded-3xl border-2",
              compatibilityInfo.isCompatible
                ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
                : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
            )}
          >
            {!userDevice ? (
              <div className="text-center py-8">
                <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="font-bold text-gray-700 mb-2">دستگاه خود را انتخاب کنید</p>
                <p className="text-gray-500 text-sm">
                  برای بررسی سازگاری، مدل گوشی یا تبلت خود را از صفحه اصلی انتخاب کنید.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {compatibilityInfo.isCompatible ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                ) : (
                  <XCircle className="w-12 h-12 text-gray-400" />
                )}
                <div>
                  <p className="font-bold text-lg text-gray-800">
                    {compatibilityInfo.message}
                  </p>
                  <p className="text-sm text-gray-500">
                    {compatibilityInfo.isCompatible 
                      ? 'این محصول به طور کامل با دستگاه شما سازگار است.'
                      : 'سازگاری این محصول نیاز به بررسی بیشتر دارد.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* لیست دستگاه‌های سازگار */}
          <div className="mt-6">
            <h4 className="font-bold text-gray-800 mb-3">دستگاه‌های سازگار:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(product.compatible_models || []).slice(0, 8).map((model) => (
                <div
                  key={model.id}
                  className="p-3 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="aspect-square rounded-lg bg-gray-50 mb-2 overflow-hidden">
                    {model.image ? (
                      <img
                        src={model.image}
                        alt={model.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">{model.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
