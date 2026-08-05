import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Smartphone, Tablet, Laptop, Watch, Headphones, X, Check, Sparkles, TrendingUp } from 'lucide-react';
import { useModelStore } from '@/store/modelStore';
import { deviceService } from '@/services/api/device.service';
import type { Brand, PhoneModel } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface SmartDevicePickerProps {
  onDeviceSelect?: (device: PhoneModel) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  id: number;
  name: string;
  brand: string;
  image?: string;
  type: 'mobile' | 'tablet' | 'laptop' | 'watch' | 'accessory';
}

const DEVICE_TYPES = [
  { id: 'mobile', label: 'موبایل', icon: Smartphone, color: 'from-blue-500 to-cyan-500' },
  { id: 'tablet', label: 'تبلت', icon: Tablet, color: 'from-purple-500 to-pink-500' },
  { id: 'laptop', label: 'لپ‌تاپ', icon: Laptop, color: 'from-gray-700 to-gray-900' },
  { id: 'watch', label: 'ساعت هوشمند', icon: Watch, color: 'from-orange-500 to-red-500' },
  { id: 'accessory', label: 'لوازم جانبی', icon: Headphones, color: 'from-green-500 to-emerald-500' },
] as const;

const POPULAR_DEVICES = [
  { id: 1, name: 'iPhone 15 Pro Max', brand: 'Apple', image: '/devices/iphone-15-pro-max.png', type: 'mobile' as const },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', image: '/devices/galaxy-s24-ultra.png', type: 'mobile' as const },
  { id: 3, name: 'Xiaomi 14 Pro', brand: 'Xiaomi', image: '/devices/xiaomi-14-pro.png', type: 'mobile' as const },
];

export function SmartDevicePicker({ 
  onDeviceSelect, 
  placeholder = "دستگاه خود را وارد کنید تا دنیای لوازم جانبی سازگار را ببینید...",
  className 
}: SmartDevicePickerProps) {
  const { setSelectedModel, selectedModel } = useModelStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // جستجوی هوشمند دستگاه‌ها
  const searchDevices = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: اتصال به API واقعی بک‌اند Laravel
      // const response = await deviceService.searchDevices(query, selectedType);
      
      // شبیه‌سازی نتایج برای نمایش
      const mockResults: SearchResult[] = [
        { id: 1, name: 'iPhone 15 Pro Max', brand: 'Apple', type: 'mobile' },
        { id: 2, name: 'iPhone 15 Pro', brand: 'Apple', type: 'mobile' },
        { id: 3, name: 'iPhone 15', brand: 'Apple', type: 'mobile' },
        { id: 4, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', type: 'mobile' },
        { id: 5, name: 'Samsung Galaxy S24+', brand: 'Samsung', type: 'mobile' },
        { id: 6, name: 'Xiaomi 14 Pro', brand: 'Xiaomi', type: 'mobile' },
      ].filter(device => 
        device.name.toLowerCase().includes(query.toLowerCase()) ||
        device.brand.toLowerCase().includes(query.toLowerCase())
      );

      setResults(mockResults);
    } catch (error) {
      console.error('Error searching devices:', error);
      toast.error('خطا در جستجوی دستگاه‌ها');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  // Debounce برای جستجو
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDevices(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchDevices]);

  // کلیک بیرون از دراپ‌داون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeviceSelect = useCallback((device: SearchResult) => {
    // TODO: دریافت اطلاعات کامل دستگاه از API
    const fullDevice: PhoneModel = {
      id: device.id,
      series_id: 1,
      brand_id: device.brand === 'Apple' ? 1 : device.brand === 'Samsung' ? 2 : 3,
      name: device.name,
      slug: device.name.toLowerCase().replace(/\s+/g, '-'),
      image: device.image || '/devices/default.png',
      release_year: 2024,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSelectedModel(fullDevice);
    setSearchTerm(device.name);
    setIsFocused(false);
    onDeviceSelect?.(fullDevice);
    toast.success(`دستگاه ${device.name} انتخاب شد`);
  }, [setSelectedModel, onDeviceSelect]);

  const clearSelection = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className={cn("relative w-full max-w-4xl mx-auto", className)}>
      {/* نوار جستجوی اصلی */}
      <div 
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300",
          "bg-white shadow-xl border-2",
          isFocused 
            ? "border-primary-500 shadow-2xl shadow-primary-500/20 scale-[1.02]" 
            : "border-transparent hover:border-gray-200",
          "backdrop-blur-sm"
        )}
      >
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-lg font-medium text-gray-800 placeholder-gray-400 outline-none"
          dir="rtl"
        />

        {searchTerm && (
          <button
            onClick={clearSelection}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="پاک کردن جستجو"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}

        <button
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5"
        >
          جستجو
        </button>
      </div>

      {/* فیلترهای نوع دستگاه */}
      <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedType('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap",
            selectedType === 'all'
              ? "bg-primary-100 text-primary-700 shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          <Smartphone className="w-5 h-5" />
          همه دستگاه‌ها
        </button>
        {DEVICE_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap",
              selectedType === type.id
                ? `bg-gradient-to-r ${type.color} text-white shadow-lg`
                : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <type.icon className="w-5 h-5" />
            {type.label}
          </button>
        ))}
      </div>

      {/* نتایج جستجو - دراپ‌داون */}
      {isFocused && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <p className="text-sm text-gray-500 font-medium">
              {results.length} نتیجه یافت شد
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {results.map((device, index) => (
              <button
                key={`${device.id}-${index}`}
                onClick={() => handleDeviceSelect(device)}
                className="w-full flex items-center gap-4 p-3 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent rounded-2xl transition-all duration-200 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {device.image ? (
                    <img
                      src={device.image}
                      alt={device.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Smartphone className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 text-right">
                  <p className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                    {device.name}
                  </p>
                  <p className="text-sm text-gray-500">{device.brand}</p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="w-6 h-6 text-primary-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* دستگاه‌های محبوب - وقتی جستجو خالی است */}
      {isFocused && results.length === 0 && !isLoading && !searchTerm && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50"
        >
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
            <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              دستگاه‌های محبوب
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {POPULAR_DEVICES.map((device) => (
              <button
                key={device.id}
                onClick={() => handleDeviceSelect(device)}
                className="group p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white hover:from-primary-50 hover:to-transparent border border-gray-100 hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 mb-3 overflow-hidden">
                  {device.image ? (
                    <img
                      src={device.image}
                      alt={device.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Smartphone className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="font-bold text-gray-800 text-sm group-hover:text-primary-600 transition-colors">
                  {device.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{device.brand}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* حالت لودینگ */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">در حال جستجو...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
