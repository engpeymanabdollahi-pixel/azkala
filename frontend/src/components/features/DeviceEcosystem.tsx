import { useState, useMemo } from 'react';
import { 
  Smartphone, Tablet, Laptop, Watch, Headphones, 
  Plus, Trash2, Edit2, Check, X, Sparkles, Package,
  TrendingUp, Zap, Star, ShoppingCart, CheckCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PhoneModel } from '@/types/models';
import { Badge } from '@/components/ui/Badge';

interface DeviceEcosystemProps {
  userDevices: UserDeviceItem[];
  onAddDevice: () => void;
  onRemoveDevice: (deviceId: number) => void;
  onSelectDevice: (device: UserDeviceItem) => void;
  selectedDeviceId?: number | null;
  className?: string;
}

interface UserDeviceItem {
  id: number;
  device: PhoneModel;
  nickname?: string;
  type: 'mobile' | 'tablet' | 'laptop' | 'watch' | 'accessory';
  isPrimary?: boolean;
  addedAt: string;
}

const DEVICE_TYPE_CONFIG = {
  mobile: { icon: Smartphone, color: 'from-blue-500 to-cyan-500', label: 'موبایل' },
  tablet: { icon: Tablet, color: 'from-purple-500 to-pink-500', label: 'تبلت' },
  laptop: { icon: Laptop, color: 'from-gray-700 to-gray-900', label: 'لپ‌تاپ' },
  watch: { icon: Watch, color: 'from-orange-500 to-red-500', label: 'ساعت هوشمند' },
  accessory: { icon: Headphones, color: 'from-green-500 to-emerald-500', label: 'لوازم جانبی' },
};

export function DeviceEcosystem({
  userDevices,
  onAddDevice,
  onRemoveDevice,
  onSelectDevice,
  selectedDeviceId,
  className,
}: DeviceEcosystemProps) {
  const [isAddingMode, setIsAddingMode] = useState(false);

  // دستگاه اصلی را پیدا کن
  const primaryDevice = useMemo(() => {
    return userDevices.find(d => d.isPrimary) || userDevices[0];
  }, [userDevices]);

  // دسته‌بندی دستگاه‌ها بر اساس نوع
  const devicesByType = useMemo(() => {
    const grouped: Record<string, UserDeviceItem[]> = {};
    
    userDevices.forEach(device => {
      if (!grouped[device.type]) {
        grouped[device.type] = [];
      }
      grouped[device.type].push(device);
    });
    
    return grouped;
  }, [userDevices]);

  return (
    <div className={cn("w-full", className)}>
      {/* هدر بخش */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary-500" />
            اکوسیستم دستگاه‌های من
          </h2>
          <p className="text-gray-500 mt-1">
            دستگاه‌های خود را مدیریت کنید و محصولات سازگار را ببینید
          </p>
        </div>

        <button
          onClick={onAddDevice}
          className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          افزودن دستگاه
        </button>
      </div>

      {/* نمایش دستگاه اصلی انتخاب شده */}
      {primaryDevice && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 shadow-xl shadow-primary-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                DEVICE_TYPE_CONFIG[primaryDevice.type].color
              )}>
                <primaryDevice.type === 'mobile' ? Smartphone :
                  primaryDevice.type === 'tablet' ? Tablet :
                  primaryDevice.type === 'laptop' ? Laptop :
                  primaryDevice.type === 'watch' ? Watch : Headphones
                }
                <span className="text-white">
                  {primaryDevice.type === 'mobile' ? <Smartphone className="w-8 h-8" /> :
                   primaryDevice.type === 'tablet' ? <Tablet className="w-8 h-8" /> :
                   primaryDevice.type === 'laptop' ? <Laptop className="w-8 h-8" /> :
                   primaryDevice.type === 'watch' ? <Watch className="w-8 h-8" /> :
                   <Headphones className="w-8 h-8" />}
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-gray-800">
                    {primaryDevice.nickname || primaryDevice.device.name}
                  </h3>
                  {primaryDevice.isPrimary && (
                    <Badge variant="success" size="sm">دستگاه اصلی</Badge>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {DEVICE_TYPE_CONFIG[primaryDevice.type].label} • اضافه شده در {new Date(primaryDevice.addedAt).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectDevice(primaryDevice)}
              className="px-6 py-3 bg-white border-2 border-primary-200 text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors"
            >
              مشاهده محصولات سازگار
            </button>
          </div>
        </div>
      )}

      {/* شبکه دستگاه‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* کارت افزودن دستگاه جدید */}
        <button
          onClick={onAddDevice}
          className="group p-6 rounded-3xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 min-h-[200px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary-600" />
          </div>
          <span className="font-bold text-gray-600 group-hover:text-primary-700">
            افزودن دستگاه جدید
          </span>
        </button>

        {/* کارت‌های دستگاه‌های کاربر */}
        {userDevices.map((device) => (
          <div
            key={device.id}
            className={cn(
              "group relative p-5 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl",
              selectedDeviceId === device.id
                ? "bg-gradient-to-br from-primary-50 to-white border-primary-300 shadow-lg shadow-primary-500/10"
                : "bg-white border-gray-100 hover:border-primary-200"
            )}
          >
            {/* دکمه حذف */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveDevice(device.id);
              }}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="حذف دستگاه"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>

            {/* آیکون نوع دستگاه */}
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
              DEVICE_TYPE_CONFIG[device.type].color
            )}>
              <span className="text-white">
                {device.type === 'mobile' ? <Smartphone className="w-6 h-6" /> :
                 device.type === 'tablet' ? <Tablet className="w-6 h-6" /> :
                 device.type === 'laptop' ? <Laptop className="w-6 h-6" /> :
                 device.type === 'watch' ? <Watch className="w-6 h-6" /> :
                 <Headphones className="w-6 h-6" />}
              </span>
            </div>

            {/* اطلاعات دستگاه */}
            <div className="mb-4">
              <h4 className="font-bold text-gray-800 truncate">
                {device.nickname || device.device.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {DEVICE_TYPE_CONFIG[device.type].label}
              </p>
            </div>

            {/* وضعیت انتخاب */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => onSelectDevice(device)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  selectedDeviceId === device.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700"
                )}
              >
                {selectedDeviceId === device.id ? 'انتخاب شده' : 'انتخاب'}
              </button>

              {device.isPrimary && (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
            </div>

            {/* نشانگر دستگاه اصلی */}
            {device.isPrimary && (
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg">
                ⭐ اصلی
              </div>
            )}
          </div>
        ))}
      </div>

      {/* پیام وقتی دستگاهی وجود ندارد */}
      {userDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            هنوز دستگاهی اضافه نکرده‌اید
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            با افزودن دستگاه‌های خود، می‌توانید محصولات سازگار با هر کدام را به صورت جداگانه مشاهده و خریداری کنید.
          </p>
          <button
            onClick={onAddDevice}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            اولین دستگاه را اضافه کنید
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * کامپوننت ویترین محصولات بر اساس دستگاه انتخاب شده
 */
interface DeviceProductShowcaseProps {
  selectedDevice: UserDeviceItem | null;
  products: any[]; // Product type
  isLoading: boolean;
  onAddToCart: (productId: number) => void;
  className?: string;
}

export function DeviceProductShowcase({
  selectedDevice,
  products,
  isLoading,
  onAddToCart,
  className,
}: DeviceProductShowcaseProps) {
  if (!selectedDevice) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">
          یک دستگاه از اکوسیستم خود انتخاب کنید تا محصولات سازگار را ببینید
        </p>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-white border border-primary-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
            DEVICE_TYPE_CONFIG[selectedDevice.type].color
          )}>
            <span className="text-white">
              {selectedDevice.type === 'mobile' ? <Smartphone className="w-5 h-5" /> :
               selectedDevice.type === 'tablet' ? <Tablet className="w-5 h-5" /> :
               <Smartphone className="w-5 h-5" />}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">
              محصولات سازگار با {selectedDevice.nickname || selectedDevice.device.name}
            </h3>
            <p className="text-xs text-gray-500">
              {products.length} محصول یافت شد
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">محصولی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden">
                {product.main_image ? (
                  <img
                    src={product.main_image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              
              <h4 className="font-bold text-gray-800 text-sm truncate mb-2">
                {product.name}
              </h4>
              
              <div className="flex items-center justify-between">
                <div>
                  {product.discount_price ? (
                    <>
                      <span className="text-xs text-gray-400 line-through ml-2">
                        {product.price.toLocaleString()}
                      </span>
                      <span className="text-lg font-black text-primary-600">
                        {product.discount_price.toLocaleString()} تومان
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-black text-gray-800">
                      {product.price.toLocaleString()} تومان
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => onAddToCart(product.id)}
                  className="w-8 h-8 rounded-full bg-primary-100 hover:bg-primary-600 flex items-center justify-center transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 text-primary-600 hover:text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
