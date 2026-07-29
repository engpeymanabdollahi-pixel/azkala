import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X, ChevronRight, Smartphone, Search, Check, ArrowLeft, 
  Sparkles, TrendingUp, Award, Zap, Loader2, Laptop, Tablet 
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
}

interface HierarchySeries {
  id: number;
  name: string;
  models: HierarchyModel[];
}

interface HierarchyModel {
  id: number;
  name: string;
  slug: string;
  release_year?: number;
}

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
      .sort((a, b) => b.series.length - a.series.length)
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
      logo: null,
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
      image: null,
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
      image: null,
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
    brand: 'انتخاب برند',
    series: tempBrand?.name || '',
    model: tempSeries?.name || '',
  }), [tempBrand?.name, tempSeries?.name]);

  const currentStepIndex = step === 'brand' ? 0 : step === 'series' ? 1 : 2;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} size="lg" showCloseButton={false}>
      {/* Header - کوچک‌تر */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {step !== 'brand' ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all hover:scale-110 text-white flex-shrink-0 shadow-md flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5 flex-wrap">
              <button onClick={handleReset} className={cn('hover:text-primary-600 transition-colors', step === 'brand' && 'text-primary-600 font-bold')}>
                برند
              </button>
              {(step === 'series' || step === 'model') && (
                <>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                  <span className={cn('truncate', step === 'series' ? 'text-primary-600 font-bold' : 'text-gray-700')}>
                    {tempBrand?.name}
                  </span>
                </>
              )}
              {step === 'model' && (
                <>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-primary-600 font-bold truncate">{tempSeries?.name}</span>
                </>
              )}
            </div>
            <h2 className="text-sm font-black text-gray-900 truncate">{stepTitle[step]}</h2>
          </div>
        </div>

        <button onClick={closeModal} className="w-9 h-9 bg-white hover:bg-error-50 border border-gray-200 hover:border-error-300 rounded-lg transition-all text-gray-500 hover:text-error-500 flex-shrink-0 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Steps - کوچک‌تر */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100">
        {(['brand', 'series', 'model'] as Step[]).map((s, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const labels = { brand: 'برند', series: 'سری', model: 'مدل' };
          const icons = { brand: Award, series: Smartphone, model: Sparkles };
          const Icon = icons[s];

          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all',
                isCurrent && 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md scale-110',
                isCompleted && 'bg-gradient-to-br from-success-500 to-success-600 text-white',
                !isCurrent && !isCompleted && 'bg-gray-200 text-gray-500'
              )}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
              </div>
              <span className={cn('text-[10px] font-bold hidden sm:block', isCurrent ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-gray-400')}>
                {labels[s]}
              </span>
              {idx < 2 && <div className={cn('flex-1 h-0.5 rounded-full mx-1', isCompleted ? 'bg-success-500' : 'bg-gray-200')} />}
            </div>
          );
        })}
      </div>

      {/* Main Content - کوچک‌تر */}
      <div className="p-3 overflow-y-auto" style={{ maxHeight: '45vh' }}>
        {error && (
          <div className="mb-3 bg-error-50 border border-error-200 rounded-lg p-3">
            <p className="text-error-700 text-xs mb-1">{error}</p>
            <button onClick={loadHierarchy} className="text-error-600 text-[10px] font-bold hover:underline">تلاش مجدد</button>
          </div>
        )}

        <div className="mb-3 sticky top-0 bg-white pb-2 z-10">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-xs"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-gray-500 text-xs mt-2">در حال بارگذاری...</p>
          </div>
        ) : (
          <>
            {/* Step: Brand */}
            {step === 'brand' && (
              <div className="animate-fade-in">
                {/* انتخاب نوع دستگاه - کوچک‌تر */}
                <div className="mb-3">
                  <p className="text-[11px] font-bold text-gray-700 mb-2">نوع دستگاه:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: 'all', label: 'همه', icon: Sparkles },
                      { value: 'mobile', label: 'موبایل', icon: Smartphone },
                      { value: 'laptop', label: 'لپ‌تاپ', icon: Laptop },
                      { value: 'tablet', label: 'تبلت', icon: Tablet },
                    ].map((type) => {
                      const Icon = type.icon;
                      const isActive = selectedDeviceType === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setSelectedDeviceType(type.value)}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                            isActive
                              ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* برندهای پرطرفدار - کوچک‌تر */}
                {!searchTerm && popularBrands.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingUp className="w-3 h-3 text-primary-500" />
                      <h3 className="text-[11px] font-black text-gray-700">پرطرفدارها</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularBrands.map((brand) => (
                        <button key={`popular-${brand.id}`} onClick={() => handleSelectBrand(brand)} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 transition-all text-[11px] font-semibold">
                          <Smartphone className="w-3 h-3 text-primary-500" />
                          <span>{brand.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* لیست برندها - کوچک‌تر */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                      <button key={brand.id} onClick={() => handleSelectBrand(brand)} className="group p-2 bg-white border border-gray-200 rounded-lg transition-all text-center hover:border-primary-500 hover:shadow-md">
                        <div className="w-10 h-10 mx-auto mb-1 flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg group-hover:scale-110 transition-transform">
                          <Smartphone className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-bold text-[11px] block text-gray-800 truncate">{brand.name}</span>
                        <span className="text-[9px] text-gray-400">{brand.series.length} سری</span>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="font-bold text-gray-900 text-xs mb-1">برندی یافت نشد</p>
                      <p className="text-[10px] text-gray-500">برندی در این دسته‌بندی وجود ندارد</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: Series - کوچک‌تر */}
            {step === 'series' && (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                {filteredSeries.length > 0 ? (
                  filteredSeries.map((s) => (
                    <button key={s.id} onClick={() => handleSelectSeries(s)} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg transition-all group hover:border-primary-500 hover:shadow-md">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="font-bold text-[11px] text-gray-900 block truncate">{s.name}</span>
                        <span className="text-[9px] text-gray-400">{s.models.length} مدل</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="font-bold text-gray-900 text-xs mb-1">سری‌ای یافت نشد</p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Model - کوچک‌تر */}
            {step === 'model' && (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <button key={model.id} onClick={() => handleSelectModel(model)} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg transition-all hover:border-success-500 hover:shadow-md group">
                      <div className="w-10 h-10 bg-gradient-to-br from-success-100 to-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-5 h-5 text-success-600" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="font-bold text-[11px] text-gray-900 block truncate">{model.name}</span>
                        {model.release_year && (
                          <span className="text-[9px] text-gray-400">{model.release_year}</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="font-bold text-gray-900 text-xs mb-1">مدلی یافت نشد</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}