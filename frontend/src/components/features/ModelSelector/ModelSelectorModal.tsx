import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X, ChevronRight, Smartphone, Search, Check,
  Sparkles, TrendingUp, Award, Loader2,
  BookmarkCheck, BookmarkPlus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useModelStore } from '@/store/modelStore';
import { Modal } from '@/components/ui/Modal';
import { SafeImage } from '@/components/ui/SafeImage';
import { deviceService } from '@/services/api/device.service';
import { useUserDevices } from '@/hooks/useUserDevices';
import { useAuthStore } from '@/store/authStore';
import type { Brand, PhoneSeries, PhoneModel } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type Step = 'brand' | 'series' | 'model';

interface HierarchyBrand {
  id: number;
  name: string;
  slug: string;
  // ✅ Device-First Architecture — حذف نهایی type: فیلتر این مودال کاملاً
  // family داده‌محور است.
  family: { id: number; name: string; slug: string; icon: string | null } | null;
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
  image?: string | null;
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

  // ✅ سناریو B: دستگاه‌های ذخیره‌شده‌ی کاربر برای دسترسی سریع در همین مودال
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { devices: myDevices, addDevice, removeDevice, isAdding } = useUserDevices();

  const [step, setStep] = useState<Step>('brand');
  const [searchTerm, setSearchTerm] = useState('');
  // ✅ فاز ۱H: 'all' یا family.slug واقعی — دیگر 'mobile'/'laptop'/'tablet'
  // هاردکد نیست.
  const [selectedFamilySlug, setSelectedFamilySlug] = useState<string>('all');
  const [tempBrand, setTempBrand] = useState<HierarchyBrand | null>(null);
  const [tempSeries, setTempSeries] = useState<HierarchySeries | null>(null);

  // ✅ فاز ۱F/۱H: خانواده‌های فعالِ دستگاه — منبع تراشه‌های فیلتر، داده‌محور.
  const { data: families = [] } = useQuery({
    queryKey: ['device-families'],
    queryFn: deviceService.getFamilies,
    staleTime: 5 * 60 * 1000,
  });

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
      setSelectedFamilySlug('all');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (selectedFamilySlug === 'all') return hierarchy;
    return hierarchy.filter(brand => brand.family?.slug === selectedFamilySlug);
  }, [hierarchy, selectedFamilySlug]);

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
      // ✅ فاز ۵: family همراه انتخاب ذخیره می‌شود تا Header/ModelSelector و
      // useProductDetail بتوانند آیکون را family-first resolve کنند.
      family: tempBrand.family,
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
      // قبلاً همیشه null بود، با اینکه device_models.image ستون واقعی و
      // پرشده‌ای است — کنترلر حالا آن را می‌فرستد، اینجا هم واقعاً ذخیره می‌شود.
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

  // ✅ سناریو B: انتخاب مستقیم یک دستگاه ذخیره‌شده («دستگاه‌های من») —
  // ویزارد برند→سری→مدل را دور می‌زند، همان الگوی handleSelectModel را
  // با داده‌ی از قبل کامل (به‌جای hierarchy موقت) اجرا می‌کند.
  const handleSelectSavedDevice = useCallback((device: (typeof myDevices)[number]) => {
    const pm = device.phone_model;
    if (!pm || !pm.brand) return;

    const brandForStore: Brand = {
      id: pm.brand.id,
      name: pm.brand.name,
      slug: pm.brand.slug || '',
      logo: pm.brand.logo || null,
      // ✅ فاز ۵: همان propagation برای دستگاه‌های ذخیره‌شده («دستگاه‌های
      // من») — بک‌اند حالا family را در همین مسیر هم eager-load می‌کند.
      family: pm.brand.family ?? null,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const seriesForStore: PhoneSeries | undefined = pm.series
      ? {
          id: pm.series.id,
          brand_id: brandForStore.id,
          name: pm.series.name,
          slug: pm.series.slug || '',
          brand: brandForStore,
          created_at: '',
          updated_at: '',
        }
      : undefined;

    const modelForStore: PhoneModel = {
      id: pm.id,
      series_id: seriesForStore?.id || 0,
      brand_id: brandForStore.id,
      name: pm.name,
      slug: pm.slug || '',
      image: pm.image || null,
      release_year: pm.release_year,
      is_active: true,
      brand: brandForStore,
      series: seriesForStore,
      specs: {},
      created_at: '',
      updated_at: '',
    };

    setSelectedBrand(brandForStore);
    if (seriesForStore) setSelectedSeries(seriesForStore);
    setSelectedModel(modelForStore);

    toast.success(`${pm.name} انتخاب شد`, { icon: '📱', duration: 1500 });
    closeModal();
    resetState();
  }, [setSelectedBrand, setSelectedSeries, setSelectedModel, closeModal]);

  // ✅ سناریو B: دکمه‌ی ذخیره/حذف کنار هر مدل در مرحله‌ی سوم — بدون نیاز
  // به انتخاب کامل آن به‌عنوان دستگاه فعال.
  const handleToggleSaveModel = useCallback(async (e: React.MouseEvent, model: HierarchyModel) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    const saved = myDevices.find((d) => d.phone_model_id === model.id);
    if (saved) {
      await removeDevice(saved.id);
    } else {
      await addDevice(model.id);
    }
  }, [isAuthenticated, myDevices, addDevice, removeDevice]);

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
    setSelectedFamilySlug('all');
  }, [clearSelection]);

  const resetState = () => {
    setStep('brand');
    setTempBrand(null);
    setTempSeries(null);
    setSearchTerm('');
    setSelectedFamilySlug('all');
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
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {step !== 'brand' ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all hover:scale-110 text-white flex-shrink-0 shadow-md flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              type="button"
              aria-label="بازگشت"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 flex-wrap">
              <button
                onClick={handleReset}
                className={cn('hover:text-primary-600 dark:hover:text-primary-400 transition-colors', step === 'brand' && 'text-primary-600 dark:text-primary-400 font-bold')}
                type="button"
              >
                برند
              </button>
              {(step === 'series' || step === 'model') && (
                <>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-400 dark:text-gray-600" />
                  <span className={cn('truncate', step === 'series' ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-700 dark:text-gray-300')}>
                    {tempBrand?.name}
                  </span>
                </>
              )}
              {step === 'model' && (
                <>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-400 dark:text-gray-600" />
                  <span className="text-primary-600 dark:text-primary-400 font-bold truncate">{tempSeries?.name}</span>
                </>
              )}
            </div>
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{stepTitle[step]}</h2>
          </div>
        </div>

        <button
          onClick={closeModal}
          className="w-9 h-9 bg-white dark:bg-gray-800 hover:bg-error-50 dark:hover:bg-error-900/20 border border-gray-200 dark:border-gray-600 hover:border-error-300 dark:hover:border-error-700 rounded-lg transition-all text-gray-500 dark:text-gray-400 hover:text-error-500 flex-shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          type="button"
          aria-label="بستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Steps - کوچک‌تر */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
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
                !isCurrent && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              )}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
              </div>
              <span className={cn('text-[10px] font-bold hidden sm:block', isCurrent ? 'text-primary-600 dark:text-primary-400' : isCompleted ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500')}>
                {labels[s]}
              </span>
              {idx < 2 && <div className={cn('flex-1 h-0.5 rounded-full mx-1', isCompleted ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-700')} />}
            </div>
          );
        })}
      </div>

      {/* Main Content - کوچک‌تر */}
      <div className="p-3 overflow-y-auto bg-white dark:bg-gray-800" style={{ maxHeight: '45vh' }}>
        {error && (
          <div className="mb-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3">
            <p className="text-error-700 dark:text-error-400 text-xs mb-1">{error}</p>
            <button onClick={loadHierarchy} className="text-error-600 dark:text-error-400 text-[10px] font-bold hover:underline" type="button">تلاش مجدد</button>
          </div>
        )}

        <div className="mb-3 sticky top-0 bg-white dark:bg-gray-800 pb-2 z-10">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 transition-all text-xs"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500" type="button" aria-label="پاک کردن جستجو">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">در حال بارگذاری...</p>
          </div>
        ) : (
          <>
            {/* Step: Brand */}
            {step === 'brand' && (
              <div className="animate-fade-in">
                {/* ✅ Device-First Architecture فاز ۱H: تراشه‌های اکوسیستم
                    اکنون داده‌محورند — از /device-families می‌آیند، نه یک
                    آرایه‌ی هاردکد mobile/laptop/tablet. افزودن یک خانواده‌ی
                    جدید (مثلاً Smartwatch) از ادمین، بدون هیچ تغییر کدی،
                    همین‌جا ظاهر می‌شود. */}
                {families.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-2">نوع دستگاه:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[{ slug: 'all', name: 'همه' }, ...families].map((family) => {
                        const isActive = selectedFamilySlug === family.slug;
                        return (
                          <button
                            key={family.slug}
                            onClick={() => setSelectedFamilySlug(family.slug)}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                              isActive
                                ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                                : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
                            )}
                            type="button"
                          >
                            {family.slug === 'all' ? <Sparkles className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                            {family.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ✅ سناریو B: دستگاه‌های من - دسترسی سریع بدون طی کردن ویزارد */}
                {!searchTerm && isAuthenticated && myDevices.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-2">
                      <BookmarkCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                      <h3 className="text-[11px] font-black text-gray-700 dark:text-gray-300">دستگاه‌های من</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {myDevices.map((device) => (
                        <button
                          key={device.id}
                          onClick={() => handleSelectSavedDevice(device)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/10 hover:bg-success-100 dark:hover:bg-success-900/30 transition-all text-[11px] font-semibold text-success-700 dark:text-success-300"
                          type="button"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>{device.phone_model?.brand?.name} {device.phone_model?.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* برندهای پرطرفدار - کوچک‌تر */}
                {!searchTerm && popularBrands.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingUp className="w-3 h-3 text-primary-500 dark:text-primary-400" />
                      <h3 className="text-[11px] font-black text-gray-700 dark:text-gray-300">پرطرفدارها</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularBrands.map((brand) => (
                        <button
                          key={`popular-${brand.id}`}
                          onClick={() => handleSelectBrand(brand)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all text-[11px] font-semibold text-gray-700 dark:text-gray-200"
                          type="button"
                        >
                          <Smartphone className="w-3 h-3 text-primary-500 dark:text-primary-400" />
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
                      <button
                        key={brand.id}
                        onClick={() => handleSelectBrand(brand)}
                        className="group p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-all text-center hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        type="button"
                      >
                        <div className="w-10 h-10 mx-auto mb-1 flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 rounded-lg group-hover:scale-110 transition-transform">
                          <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="font-bold text-[11px] block text-gray-800 dark:text-gray-100 truncate">{brand.name}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">{brand.series.length} سری</span>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">برندی یافت نشد</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">برندی در این دسته‌بندی وجود ندارد</p>
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
                    <button
                      key={s.id}
                      onClick={() => handleSelectSeries(s)}
                      className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-all group hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      type="button"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="font-bold text-[11px] text-gray-900 dark:text-gray-100 block truncate">{s.name}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">{s.models.length} مدل</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">سری‌ای یافت نشد</p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Model - کوچک‌تر */}
            {step === 'model' && (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => {
                    const saved = myDevices.some((d) => d.phone_model_id === model.id);
                    return (
                    <div key={model.id} className="relative group">
                      <button
                        onClick={() => handleSelectModel(model)}
                        className="w-full flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-success-500 dark:hover:border-success-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500"
                        type="button"
                      >
                        {/* عکس واقعی مدل — device_models.image ستون واقعی است، قبلاً
                            اصلاً از سرور خواسته نمی‌شد و اینجا همیشه آیکون عمومی
                            دیده می‌شد. */}
                        <div className="w-10 h-10 bg-gradient-to-br from-success-100 to-primary-100 dark:from-success-900/40 dark:to-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:scale-110 transition-transform">
                          {model.image ? (
                            <SafeImage
                              src={model.image}
                              alt={model.name}
                              className="w-full h-full object-cover"
                              showEmojiOnError
                              fallbackEmoji="📱"
                            />
                          ) : (
                            <Smartphone className="w-5 h-5 text-success-600 dark:text-success-400" />
                          )}
                        </div>
                        <div className="text-right flex-1 min-w-0">
                          <span className="font-bold text-[11px] text-gray-900 dark:text-gray-100 block truncate">{model.name}</span>
                          {model.release_year && (
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">{model.release_year}</span>
                          )}
                        </div>
                      </button>
                      {/* ✅ سناریو B: ذخیره/حذف این مدل در «دستگاه‌های من»، بدون
                          نیاز به انتخابش به‌عنوان دستگاه فعال. */}
                      {isAuthenticated && (
                        <button
                          onClick={(e) => handleToggleSaveModel(e, model)}
                          disabled={isAdding}
                          className={cn(
                            // ✅ رنگ warning هم‌سو با دکمه‌ی مشابه در هدر
                            // (Header/ModelSelector.tsx) شد — همان کنش، همان
                            // زبان بصری. قبلاً همیشه آیکون BookmarkCheck
                            // («ذخیره‌شده») نشان داده می‌شد، حتی برای مدل‌های
                            // ذخیره‌نشده — گمراه‌کننده بود.
                            'absolute top-1 left-1 w-6 h-6 rounded-md flex items-center justify-center transition-all',
                            saved
                              ? 'text-white bg-gradient-to-br from-warning-400 to-warning-500 shadow-sm'
                              : 'text-warning-500 dark:text-warning-400 bg-white/90 dark:bg-gray-900/90 border border-warning-200 dark:border-warning-800 opacity-0 group-hover:opacity-100 hover:bg-warning-50 dark:hover:bg-warning-900/40'
                          )}
                          type="button"
                          title={saved ? 'حذف از دستگاه‌های من' : 'افزودن به دستگاه‌های من'}
                        >
                          {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">مدلی یافت نشد</p>
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
