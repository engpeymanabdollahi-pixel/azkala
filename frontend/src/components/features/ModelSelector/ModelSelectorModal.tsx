import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, ChevronRight, Smartphone, Search, Check, ArrowLeft, Sparkles, TrendingUp, Award, Zap, Loader2 } from 'lucide-react';
import { useModelStore } from '@/store/modelStore';
import { Modal } from '@/components/ui/Modal';
import { deviceService } from '@/services/api/device.service';
import type { Brand, PhoneSeries, PhoneModel } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type Step = 'brand' | 'series' | 'model';

// تعریف نوع داده‌ای که از API جدید دریافت می‌کنیم
interface HierarchyBrand {
  id: number;
  name: string;
  slug: string;
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
  const [tempBrand, setTempBrand] = useState<HierarchyBrand | null>(null);
  const [tempSeries, setTempSeries] = useState<HierarchySeries | null>(null);
  
  // ✅ به جای ۳ آرایه جداگانه، کل ساختار را یکجا نگه می‌داریم
  const [hierarchy, setHierarchy] = useState<HierarchyBrand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ==================== Data Fetching ====================

  useEffect(() => {
    if (isModalOpen) {
      loadHierarchy();
      
      // بازیابی وضعیت قبلی اگر کاربر قبلاً انتخابی داشته
      if (selectedSeries && selectedBrand) {
        // پیدا کردن برند و سری از داده‌های لود شده برای هماهنگی
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
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]); // فقط وقتی مودال باز می‌شود اجرا شود

  const loadHierarchy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await deviceService.getHeaderHierarchy();
      setHierarchy(data);
    } catch (err) {
      setError('خطا در بارگذاری اطلاعات دستگاه‌ها. لطفاً دوباره تلاش کنید.');
      console.error('Error loading hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== Computed Values (Filtering) ====================

  // فیلتر برندها
  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return hierarchy;
    return hierarchy.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hierarchy, searchTerm]);

  // سری‌های مربوط به برند انتخاب‌شده
  const currentSeries = useMemo(() => {
    return tempBrand ? tempBrand.series : [];
  }, [tempBrand]);

  // فیلتر سری‌ها
  const filteredSeries = useMemo(() => {
    if (!searchTerm.trim()) return currentSeries;
    return currentSeries.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentSeries, searchTerm]);

  // مدل‌های مربوط به سری انتخاب‌شده
  const currentModels = useMemo(() => {
    return tempSeries ? tempSeries.models : [];
  }, [tempSeries]);

  // فیلتر مدل‌ها
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return currentModels;
    return currentModels.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentModels, searchTerm]);

  const popularBrands = useMemo(() => {
    return [...hierarchy]
      .sort((a, b) => b.series.length - a.series.length)
      .slice(0, 6);
  }, [hierarchy]);

  // ==================== Handlers ====================

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

    // تبدیل به تایپ‌های مورد انتظار Store
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

    toast.success(`مدل ${model.name} انتخاب شد`, { icon: '📱', duration: 2000 });
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
  }, [clearSelection]);

  const resetState = () => {
    setStep('brand');
    setTempBrand(null);
    setTempSeries(null);
    setSearchTerm('');
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
    brand: 'برند گوشی خود را انتخاب کنید',
    series: `سری ${tempBrand?.name || ''} را انتخاب کنید`,
    model: `مدل ${tempSeries?.name || ''} را انتخاب کنید`,
  }), [tempBrand?.name, tempSeries?.name]);

  const getStepPlaceholder = useCallback(() => {
    if (step === 'brand') return 'جستجوی برند...';
    if (step === 'series') return `جستجوی سری ${tempBrand?.name || ''}...`;
    return `جستجوی مدل ${tempSeries?.name || ''}...`;
  }, [step, tempBrand?.name, tempSeries?.name]);

  const currentStepIndex = step === 'brand' ? 0 : step === 'series' ? 1 : 2;

  // ==================== Render ====================

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" showCloseButton={false}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {step !== 'brand' ? (
            <button
              onClick={handleBack}
              className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl transition-all hover:scale-110 text-white flex-shrink-0 shadow-lg shadow-primary-500/30 flex items-center justify-center group"
            >
              <ChevronRight className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
              <button onClick={handleReset} className={cn('hover:text-primary-600 transition-colors flex items-center gap-1', step === 'brand' && 'text-primary-600 font-bold')}>
                <Award className="w-3 h-3" /> برند
              </button>
              {(step === 'series' || step === 'model') && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className={cn('transition-colors truncate', step === 'series' ? 'text-primary-600 font-bold' : 'text-gray-700')}>
                    {tempBrand?.name}
                  </span>
                </>
              )}
              {step === 'model' && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-primary-600 font-bold truncate">{tempSeries?.name}</span>
                </>
              )}
            </div>
            <h2 className="text-lg font-black text-gray-900 truncate">{stepTitle[step]}</h2>
          </div>
        </div>

        <button onClick={closeModal} className="w-11 h-11 bg-white hover:bg-error-50 border-2 border-gray-200 hover:border-error-300 rounded-xl transition-all hover:rotate-90 text-gray-500 hover:text-error-500 flex-shrink-0 flex items-center justify-center group shadow-sm hover:shadow-md">
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-l from-gray-50 to-white border-b border-gray-100">
        {(['brand', 'series', 'model'] as Step[]).map((s, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const labels = { brand: 'برند', series: 'سری', model: 'مدل' };
          const icons = { brand: Award, series: Smartphone, model: Sparkles };
          const Icon = icons[s];

          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300',
                isCurrent && 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110 ring-4 ring-primary-100',
                isCompleted && 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-md',
                !isCurrent && !isCompleted && 'bg-gray-200 text-gray-500'
              )}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className={cn('text-xs font-bold truncate transition-colors', isCurrent ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-gray-400')}>
                  {labels[s]}
                </p>
              </div>
              {idx < 2 && <div className={cn('flex-1 h-0.5 rounded-full mx-2 transition-all', isCompleted ? 'bg-gradient-to-r from-success-500 to-success-600' : 'bg-gray-200')} />}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="p-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {error && (
          <div className="mb-4 bg-error-50 border border-error-200 rounded-2xl p-4">
            <p className="text-error-700 text-sm mb-2">{error}</p>
            <button onClick={loadHierarchy} className="text-error-600 text-xs font-bold hover:underline">تلاش مجدد</button>
          </div>
        )}

        <div className="mb-5 sticky top-0 bg-white pb-3 z-10">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={getStepPlaceholder()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all bg-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-gray-500 mt-4">در حال بارگذاری...</p>
          </div>
        ) : (
          <>
            {/* Step: Brand */}
            {step === 'brand' && (
              <div className="animate-fade-in">
                {!searchTerm && popularBrands.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary-500" />
                      <h3 className="text-sm font-black text-gray-700">برندهای پرطرفدار</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularBrands.map((brand) => (
                        <button key={`popular-${brand.id}`} onClick={() => handleSelectBrand(brand)} className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 transition-all text-sm font-semibold">
                          <Smartphone className="w-4 h-4 text-primary-500" />
                          <span>{brand.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand, index) => (
                      <button key={brand.id} onClick={() => handleSelectBrand(brand)} className="group p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all duration-300 text-center relative overflow-hidden hover:border-primary-500 hover:shadow-xl hover:-translate-y-1" style={{ animationDelay: `${index * 30}ms` }}>
                        <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl group-hover:scale-110 transition-transform">
                          <Smartphone className="w-8 h-8 text-primary-600" />
                        </div>
                        <span className="font-black text-sm block text-gray-800 group-hover:text-primary-600 transition-colors truncate">{brand.name}</span>
                        <span className="text-xs text-gray-400 mt-1 block">{brand.series.length} سری</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 absolute top-3 left-3 transition-all group-hover:-translate-x-1" />
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="font-black text-gray-900 mb-1">برندی یافت نشد</p>
                      <p className="text-sm text-gray-500">برندی با نام "{searchTerm}" در لیست ما وجود ندارد</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: Series */}
            {step === 'series' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                {filteredSeries.length > 0 ? (
                  filteredSeries.map((s, index) => (
                    <button key={s.id} onClick={() => handleSelectSeries(s)} className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all duration-300 group relative overflow-hidden hover:border-primary-500 hover:shadow-xl hover:-translate-y-1" style={{ animationDelay: `${index * 30}ms` }}>
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-7 h-7 text-primary-600" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="font-black text-gray-900 block group-hover:text-primary-600 transition-colors truncate">{s.name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Smartphone className="w-3 h-3" /> {s.models.length} مدل
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="font-black text-gray-900 mb-1">سری‌ای یافت نشد</p>
                    <p className="text-sm text-gray-500">سری‌ای با نام "{searchTerm}" برای برند {tempBrand?.name} یافت نشد</p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Model */}
            {step === 'model' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model, index) => (
                    <button key={model.id} onClick={() => handleSelectModel(model)} className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-success-500 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden" style={{ animationDelay: `${index * 30}ms` }}>
                      <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-8 h-8 text-success-600" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="font-black text-gray-900 block text-sm group-hover:text-success-600 transition-colors truncate">{model.name}</span>
                        {model.release_year && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Zap className="w-3 h-3" /> {model.release_year}
                          </span>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-gray-300 group-hover:text-success-500 transition-all flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="font-black text-gray-900 mb-1">مدلی یافت نشد</p>
                    <p className="text-sm text-gray-500">مدلی با نام "{searchTerm}" برای سری {tempSeries?.name} یافت نشد</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {step === 'brand' && hierarchy.length > 0 && !searchTerm && (
        <div className="px-5 py-3 bg-gradient-to-t from-primary-50 to-white border-t border-primary-100">
          <p className="text-xs text-primary-700 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            روی یک برند کلیک کنید تا سری‌های آن را ببینید
          </p>
        </div>
      )}
    </Modal>
  );
}