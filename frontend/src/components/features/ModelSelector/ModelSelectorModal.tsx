import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X, ChevronRight, Smartphone, Search, Check, ArrowLeft, 
  Sparkles, TrendingUp, Award, Zap, Loader2, Laptop, Tablet,
  Watch, Headphones, ChevronLeft, Star, Flame, Gift
} from 'lucide-react';
import { useModelStore } from '@/store/modelStore';
import { Modal } from '@/components/ui/Modal';
import { deviceService } from '@/services/api/device.service';
import type { Brand, PhoneSeries, PhoneModel } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type Step = 'brand' | 'series' | 'model';

interface HierarchyBrand {
  id: number;
  name: string;
  slug: string;
  type: 'mobile' | 'laptop' | 'tablet' | 'accessory' | null;
  series: HierarchySeries[];
  logo?: string | null;
}

interface HierarchySeries {
  id: number;
  name: string;
  image?: string | null;
  models: HierarchyModel[];
}

interface HierarchyModel {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  release_year?: number;
}

interface DeviceType {
  value: string;
  label: string;
  icon: any;
  gradient: string;
  description: string;
}

const DEVICE_TYPES: DeviceType[] = [
  { value: 'mobile', label: 'موبایل', icon: Smartphone, gradient: 'from-blue-500 to-cyan-500', description: 'گوشی‌های هوشمند' },
  { value: 'tablet', label: 'تبلت', icon: Tablet, gradient: 'from-purple-500 to-pink-500', description: 'تبلت‌ها' },
  { value: 'laptop', label: 'لپ‌تاپ', icon: Laptop, gradient: 'from-slate-500 to-gray-500', description: 'لپ‌تاپ و مک‌بوک' },
  { value: 'watch', label: 'ساعت', icon: Watch, gradient: 'from-amber-500 to-orange-500', description: 'ساعت هوشمند' },
  { value: 'audio', label: 'صدا', icon: Headphones, gradient: 'from-emerald-500 to-teal-500', description: 'هدفون و هندزفری' },
];

const POPULAR_BRANDS = ['apple', 'samsung', 'xiaomi', 'huawei'];

export function ModelSelectorModal() {
  const { 
    isModalOpen, 
    closeModal, 
    selectedBrand, 
    selectedSeries, 
    setSelectedBrand, 
    setSelectedSeries, 
    setSelectedModel, 
    clearSelection 
  } = useModelStore();
  
  const [step, setStep] = useState<Step>('brand');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [tempBrand, setTempBrand] = useState<HierarchyBrand | null>(null);
  const [tempSeries, setTempSeries] = useState<HierarchySeries | null>(null);
  
  const [hierarchy, setHierarchy] = useState<HierarchyBrand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      loadHierarchy();
      
      if (selectedSeries && selectedBrand) {
        const brand = hierarchy.find(b => b.id === selectedBrand.id);
        const series = brand?.series.find(s => s.id === selectedSeries.id);
        
        if (brand && series) {
          setTempBrand(brand);
          setTempSeries(series);
          setStep('model');
        }
      } else if (selectedBrand) {
        const brand = hierarchy.find(b => b.id === selectedBrand.id);
        if (brand) {
          setTempBrand(brand);
          setStep('series');
        }
      } else {
        setStep('brand');
      }
      
      setSearchTerm('');
      setSelectedDeviceType('all');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  const loadHierarchy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await deviceService.getHeaderHierarchy();
      setHierarchy(data);
    } catch (err) {
      setError('خطا در بارگذاری اطلاعات دستگاه‌ها.');
      console.error('Error loading hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHierarchy = useMemo(() => {
    if (selectedDeviceType === 'all') return hierarchy;
    return hierarchy.filter(brand => brand.type === selectedDeviceType);
  }, [hierarchy, selectedDeviceType]);

  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return filteredHierarchy;
    return filteredHierarchy.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredHierarchy, searchTerm]);

  const popularBrands = useMemo(() => {
    return [...filteredHierarchy]
      .filter(b => POPULAR_BRANDS.includes(b.slug))
      .slice(0, 4);
  }, [filteredHierarchy]);

  const currentSeries = useMemo(() => {
    return tempBrand ? tempBrand.series : [];
  }, [tempBrand]);

  const filteredSeries = useMemo(() => {
    if (!searchTerm.trim()) return currentSeries;
    return currentSeries.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentSeries, searchTerm]);

  const currentModels = useMemo(() => {
    return tempSeries ? tempSeries.models : [];
  }, [tempSeries]);

  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return currentModels;
    return currentModels.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentModels, searchTerm]);

  const handleSelectBrand = useCallback((brand: HierarchyBrand) => {
    setTempBrand(brand);
    setSearchTerm('');
    setStep('series');
  }, []);

  const handleSelectSeries = useCallback((seriesItem: HierarchySeries) => {
    setTempSeries(seriesItem);
    setSearchTerm('');
    setStep('model');
  }, []);

  const handleSelectModel = useCallback((model: HierarchyModel) => {
    if (!tempBrand || !tempSeries) return;

    const brandForStore: Brand = {
      id: tempBrand.id,
      name: tempBrand.name,
      slug: tempBrand.slug,
      logo: tempBrand.logo || null,
      is_active: true,
      series_count: tempBrand.series.length,
      models_count: 0,
      created_at: '',
      updated_at: '',
    };

    const seriesForStore: PhoneSeries = {
      id: tempSeries.id,
      brand_id: tempBrand.id,
      name: tempSeries.name,
      slug: '',
      image: tempSeries.image || null,
      models_count: tempSeries.models.length,
      brand: brandForStore,
      created_at: '',
      updated_at: '',
    };

    const modelForStore: PhoneModel = {
      id: model.id,
      series_id: tempSeries.id,
      brand_id: tempBrand.id,
      name: model.name,
      slug: model.slug,
      image: model.image || null,
      release_year: model.release_year,
      is_active: true,
      compatible_products_count: 0,
      brand: brandForStore,
      series: seriesForStore,
      specs: {},
      created_at: '',
      updated_at: '',
    };

    setSelectedBrand(brandForStore);
    setSelectedSeries(seriesForStore);
    setSelectedModel(modelForStore);

    toast.success(`${model.name} انتخاب شد`, { icon: '📱', duration: 1500 });
    closeModal();
    resetState();
  }, [tempBrand, tempSeries, setSelectedBrand, setSelectedSeries, setSelectedModel, closeModal]);

  const handleBack = useCallback(() => {
    if (step === 'series') {
      setStep('brand');
      setTempBrand(null);
      setSearchTerm('');
    } else if (step === 'model') {
      setStep('series');
      setTempSeries(null);
      setSearchTerm('');
    }
  }, [step]);

  const handleReset = useCallback(() => {
    clearSelection();
    setStep('brand');
    setTempBrand(null);
    setTempSeries(null);
    setSearchTerm('');
    setSelectedDeviceType('all');
  }, [clearSelection]);

  const resetState = () => {
    setStep('brand');
    setTempBrand(null);
    setTempSeries(null);
    setSearchTerm('');
    setSelectedDeviceType('all');
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  const stepTitle = useMemo(() => ({
    brand: 'دستگاه خود را انتخاب کنید',
    series: tempBrand?.name || '',
    model: tempSeries?.name || '',
  }), [tempBrand?.name, tempSeries?.name]);

  const currentStepIndex = step === 'brand' ? 0 : step === 'series' ? 1 : 2;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" showCloseButton={false}>
      {/* Hero Header با طراحی نئومورفیسم */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-6 text-white">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]" />
        </div>
        
        {/* Floating 3D Device Icons */}
        <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float-slow hidden lg:flex">
          <Smartphone className="w-8 h-8 text-white/80" />
        </div>
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center animate-float-delayed hidden lg:flex">
          <Tablet className="w-6 h-6 text-white/80" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={closeModal}
              className="w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black mb-1">دستگاه خود را انتخاب کنید</h2>
              <p className="text-primary-100 text-sm">برای مشاهده لوازم جانبی سازگار</p>
            </div>
          </div>

          {/* Smart Search Bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="مثلاً: iPhone 15 Pro Max، Galaxy S24 Ultra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3.5 bg-white/95 backdrop-blur-md border-0 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl text-base font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Device Type Selector */}
      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedDeviceType('all')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2",
              selectedDeviceType === 'all'
                ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white border-transparent shadow-lg shadow-primary-500/30 scale-105"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300"
            )}
          >
            <Sparkles className="w-4 h-4" />
            همه دستگاه‌ها
          </button>
          {DEVICE_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = selectedDeviceType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedDeviceType(type.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2",
                  isActive
                    ? `bg-gradient-to-r ${type.gradient} text-white border-transparent shadow-lg scale-105`
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '55vh' }}>
        {error && (
          <div className="mb-4 bg-error-50 border border-error-200 rounded-xl p-4">
            <p className="text-error-700 text-sm mb-2">{error}</p>
            <button onClick={loadHierarchy} className="text-error-600 text-xs font-bold hover:underline">تلاش مجدد</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
            <p className="text-gray-500 text-sm font-medium">در حال بارگذاری دستگاه‌ها...</p>
          </div>
        ) : (
          <>
            {/* Step: Brand */}
            {step === 'brand' && (
              <div className="animate-fade-in">
                {/* Popular Brands */}
                {!searchTerm && popularBrands.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <h3 className="text-sm font-black text-gray-900">برندهای پرطرفدار</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {popularBrands.map((brand) => (
                        <button 
                          key={`popular-${brand.id}`} 
                          onClick={() => handleSelectBrand(brand)} 
                          className="group p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl transition-all hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1"
                        >
                          <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                            <Smartphone className="w-7 h-7 text-primary-600" />
                          </div>
                          <span className="font-bold text-sm block text-gray-800 truncate">{brand.name}</span>
                          <span className="text-xs text-gray-400">{brand.series.length} سری محصول</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* All Brands Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-gray-900">
                      {searchTerm ? 'نتایج جستجو' : 'همه برندها'}
                    </h3>
                    <span className="text-xs text-gray-500">{filteredBrands.length} برند</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {filteredBrands.length > 0 ? (
                      filteredBrands.map((brand) => (
                        <button 
                          key={brand.id} 
                          onClick={() => handleSelectBrand(brand)} 
                          className="group p-3 bg-white border-2 border-gray-100 rounded-2xl transition-all hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-0.5"
                        >
                          <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <Smartphone className="w-6 h-6 text-primary-500" />
                            )}
                          </div>
                          <span className="font-bold text-xs block text-gray-800 truncate">{brand.name}</span>
                          <span className="text-[10px] text-gray-400">{brand.series.length} سری</span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-900 text-sm mb-1">برندی یافت نشد</p>
                        <p className="text-xs text-gray-500">لطفاً واژه دیگری را جستجو کنید</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Series */}
            {step === 'series' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => { setStep('brand'); setTempBrand(null); }}
                    className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">{tempBrand?.name}</h3>
                    <p className="text-xs text-gray-500">{currentSeries.length} سری محصول</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredSeries.length > 0 ? (
                    filteredSeries.map((s) => (
                      <button 
                        key={s.id} 
                        onClick={() => handleSelectSeries(s)} 
                        className="flex items-center gap-3 p-3 bg-white border-2 border-gray-100 rounded-2xl transition-all group hover:border-primary-400 hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                          {s.image ? (
                            <img src={s.image} alt={s.name} className="w-10 h-10 object-cover rounded-lg" />
                          ) : (
                            <Smartphone className="w-7 h-7 text-primary-600" />
                          )}
                        </div>
                        <div className="text-right flex-1 min-w-0">
                          <span className="font-bold text-sm text-gray-900 block truncate">{s.name}</span>
                          <span className="text-xs text-gray-400">{s.models.length} مدل</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="font-bold text-gray-900 text-sm mb-1">سری‌ای یافت نشد</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: Model */}
            {step === 'model' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => { setStep('series'); setTempSeries(null); }}
                    className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">{tempSeries?.name}</h3>
                    <p className="text-xs text-gray-500">{currentModels.length} مدل</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredModels.length > 0 ? (
                    filteredModels.map((model) => (
                      <button 
                        key={model.id} 
                        onClick={() => handleSelectModel(model)} 
                        className="group p-3 bg-white border-2 border-gray-100 rounded-2xl transition-all hover:border-success-400 hover:shadow-lg hover:shadow-success-500/10 hover:-translate-y-0.5"
                      >
                        <div className="w-full aspect-square mb-2 bg-gradient-to-br from-success-50 to-emerald-50 rounded-xl flex items-center justify-center overflow-hidden">
                          {model.image ? (
                            <img src={model.image} alt={model.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-emerald-100 rounded-xl flex items-center justify-center">
                              <Smartphone className="w-8 h-8 text-success-600" />
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-gray-900 block truncate">{model.name}</span>
                          {model.release_year && (
                            <span className="text-xs text-gray-400">{model.release_year}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-success-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-3 h-3" />
                          انتخاب
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="font-bold text-gray-900 text-sm mb-1">مدلی یافت نشد</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
