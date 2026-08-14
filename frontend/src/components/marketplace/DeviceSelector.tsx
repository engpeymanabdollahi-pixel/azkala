import { useState, useEffect } from 'react';
import { Smartphone, Tablet, Laptop, Watch, Headphones, X, ChevronDown, ChevronLeft, Check, Loader2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { deviceService, type DeviceBrand, type DeviceSeries, type DeviceModel } from '@/services/api/device.service';
import { useModelStore } from '@/store/modelStore';
import { Button } from '@/components/ui/Button';
import type { Brand, PhoneSeries, PhoneModel } from '@/types/models';
import { cn } from '@/utils/cn';
import { useUserDevices, type UserDevice } from '@/hooks/useUserDevices';
import { useAuthStore } from '@/store/authStore';

/**
 * DeviceSelector Component - Standalone
 *
 * انتخاب دستگاه سه مرحله‌ای: Brand → Series → Model
 *
 * Features:
 * - Desktop: سه dropdown کنار هم
 * - Mobile: Modal fullscreen با سه step
 * - Cascade loading (هر level بعد از انتخاب قبلی load می‌شود)
 * - Persist در localStorage (از useModelStore)
 * - آیکون‌های مختلف بر اساس نوع دستگاه
 * - RTL-first
 *
 * ⚠️ این کامپوننت هیچ‌جای برنامه import نمی‌شود — دکمه‌ی هدر واقعی
 * (Header/ModelSelector.tsx) و مودال واقعی‌اش
 * (features/ModelSelector/ModelSelectorModal.tsx) کاملاً کامپوننت‌های
 * دیگری هستند و «دستگاه‌های من» آنجا پیاده‌سازی شد. اینجا فقط برای
 * سازگاری/استفاده‌ی احتمالی آینده کامل نگه داشته شده.
 */

export type DeviceSelectorVariant = 'default' | 'compact';

interface DeviceSelectorProps {
  variant?: DeviceSelectorVariant;
  className?: string;
}

// ==================== Type Mappers ====================
// deviceService interfaces سبک هستند (برای API)، اما useModelStore از types کامل استفاده می‌کند.
// این توابع mapping تمیز و type-safe هستند.

const toBrand = (d: DeviceBrand): Brand => ({
  id: d.id,
  name: d.name,
  slug: d.slug,
  logo: d.logo || null,
  type: null, // API این را نمی‌فرستد
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const toPhoneSeries = (d: DeviceSeries): PhoneSeries => ({
  id: d.id,
  brand_id: d.brand_id,
  name: d.name,
  slug: d.slug,
  image: d.image || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const toPhoneModel = (d: DeviceModel, brand?: Brand): PhoneModel => ({
  id: d.id,
  series_id: d.series_id,
  brand_id: d.brand_id,
  name: d.name,
  slug: d.slug,
  image: d.image || null,
  is_active: true,
  brand: brand ? { ...brand } : undefined,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// ==================== Helper ====================
type DeviceType =
  | 'mobile'
  | 'laptop'
  | 'tablet'
  | 'accessory'
  | 'watch'
  | 'headphones'
  | 'headphone'
  | 'phone'
  | null
  | undefined;

const getDeviceIcon = (type?: DeviceType) => {
  switch (type?.toLowerCase()) {
    case 'tablet':
      return Tablet;
    case 'laptop':
      return Laptop;
    case 'watch':
      return Watch;
    case 'headphones':
    case 'headphone':
      return Headphones;
    default:
      return Smartphone;
  }
};

// ==================== Component ====================

export function DeviceSelector({ variant = 'default', className }: DeviceSelectorProps) {
  const {
    selectedBrand,
    selectedSeries,
    selectedModel,
    setSelectedBrand,
    setSelectedSeries,
    setSelectedModel,
    clearSelection,
    isModalOpen,
    openModal,
    closeModal,
  } = useModelStore();

  // ✅ سناریو B: hook مشترک برای My Devices
  const {
    devices,
    addDevice,
    removeDevice,
    isDeviceSaved,
    getDeviceByModelId,
    isAdding,
  } = useUserDevices();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ✅ Helper: ذخیره/حذف device فعلی از My Devices
  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedModel || !isAuthenticated) return;

    const savedDevice = getDeviceByModelId(selectedModel.id);
    if (savedDevice) {
      if (window.confirm('این دستگاه از «دستگاه‌های من» حذف شود؟')) {
        await removeDevice(savedDevice.id);
      }
    } else {
      await addDevice(selectedModel.id);
    }
  };

  const isCurrentSaved = selectedModel ? isDeviceSaved(selectedModel.id) : false;

  const [mobileStep, setMobileStep] = useState<'brand' | 'series' | 'model'>('brand');

  // Fetch brands
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['device-brands'],
    queryFn: deviceService.getBrands,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch series for selected brand
  const { data: series = [], isLoading: seriesLoading } = useQuery({
    queryKey: ['device-series', selectedBrand?.id],
    queryFn: () =>
      selectedBrand ? deviceService.getSeries(selectedBrand.id) : Promise.resolve([]),
    enabled: !!selectedBrand,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch models for selected series
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['device-models', selectedSeries?.id],
    queryFn: () =>
      selectedSeries ? deviceService.getModels(selectedSeries.id) : Promise.resolve([]),
    enabled: !!selectedSeries,
    staleTime: 5 * 60 * 1000,
  });

  // Reset mobile step when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setMobileStep(
        selectedBrand && !selectedSeries
          ? 'series'
          : selectedSeries && !selectedModel
            ? 'model'
            : 'brand'
      );
    }
  }, [isModalOpen, selectedBrand, selectedSeries, selectedModel]);

  const handleBrandSelect = (brand: DeviceBrand) => {
    setSelectedBrand(toBrand(brand));
    setMobileStep('series');
  };

  const handleSeriesSelect = (s: DeviceSeries) => {
    setSelectedSeries(toPhoneSeries(s));
    setMobileStep('model');
  };

  const handleModelSelect = (m: DeviceModel) => {
    const brand = selectedBrand ? toBrand({ ...selectedBrand, logo: selectedBrand.logo || undefined }) : undefined;
    setSelectedModel(toPhoneModel(m, brand));
    closeModal();
  };

  const handleClear = () => {
    clearSelection();
    setMobileStep('brand');
  };

  // ✅ سناریو B: انتخاب مستقیم یک دستگاه از «دستگاه‌های من» — ویزارد را دور می‌زند.
  const handleSelectSavedDevice = (device: UserDevice) => {
    const pm = device.phone_model;
    if (!pm || !pm.brand) return;

    const brandForStore: Brand = {
      id: pm.brand.id,
      name: pm.brand.name,
      slug: pm.brand.slug || '',
      logo: pm.brand.logo || null,
      type: (pm.brand.type as Brand['type']) || null,
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

    setSelectedBrand(brandForStore);
    if (seriesForStore) setSelectedSeries(seriesForStore);
    setSelectedModel({
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
    });
    closeModal();
  };

  const DeviceIcon = selectedModel
    ? getDeviceIcon(selectedModel.brand?.type as DeviceType)
    : Smartphone;

  // ============ Compact variant ============
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {selectedModel ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <DeviceIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {selectedBrand?.name} {selectedModel.name}
            </span>
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded"
              title="پاک کردن انتخاب"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        ) : (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>انتخاب دستگاه</span>
          </button>
        )}
      </div>
    );
  }

  // ============ Default variant ============
  return (
    <>
      {/* Desktop: Three Dropdowns */}
      <div className={cn('hidden md:flex items-center gap-2', className)}>
        {/* Brand Select */}
        <select
          value={selectedBrand?.id || ''}
          onChange={(e) => {
            const brand = brands.find((b) => b.id === Number(e.target.value));
            if (brand) handleBrandSelect(brand);
            else handleClear();
          }}
          disabled={brandsLoading}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
        >
          <option value="">برند</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        {/* Series Select */}
        <select
          value={selectedSeries?.id || ''}
          onChange={(e) => {
            const seriesItem = series.find((s) => s.id === Number(e.target.value));
            if (seriesItem) handleSeriesSelect(seriesItem);
          }}
          disabled={!selectedBrand || seriesLoading}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">سری</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Model Select */}
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => {
            const model = models.find((m) => m.id === Number(e.target.value));
            if (model) handleModelSelect(model);
          }}
          disabled={!selectedSeries || modelsLoading}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">مدل</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Save Button */}
        {selectedModel && isAuthenticated && (
          <button
  onClick={handleToggleSave}
  disabled={isAdding}
  className={cn(
    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-black transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5',
    isCurrentSaved
      ? 'bg-success-600 hover:bg-success-700 text-white'
      : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
  )}
  title={isCurrentSaved ? 'حذف از دستگاه‌های من' : 'افزودن به دستگاه‌های من'}
>
  {isAdding ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : isCurrentSaved ? (
    <BookmarkCheck className="w-5 h-5" />
  ) : (
    <BookmarkPlus className="w-5 h-5" />
  )}
  <span>{isCurrentSaved ? 'ذخیره شد' : 'افزودن به دستگاه‌های من'}</span>
</button>
        )}

        {/* Clear Button */}
        {selectedModel && (
          <button
            onClick={handleClear}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="پاک کردن انتخاب"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Mobile: Button to open modal */}
      <button
        onClick={openModal}
        className={cn(
          'md:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium',
          className
        )}
      >
        {selectedModel ? (
          <>
            <DeviceIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
              {selectedBrand?.name} {selectedModel.name}
            </span>
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">انتخاب دستگاه</span>
          </>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Mobile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-white dark:bg-slate-800 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {mobileStep === 'brand' && 'انتخاب برند'}
                {mobileStep === 'series' && `سری‌های ${selectedBrand?.name || ''}`}
                {mobileStep === 'model' && `مدل‌های ${selectedSeries?.name || ''}`}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <div
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  'bg-primary-500'
                )}
              />
              <div
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  mobileStep === 'series' || mobileStep === 'model'
                    ? 'bg-primary-500'
                    : 'bg-gray-200 dark:bg-slate-700'
                )}
              />
              <div
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  mobileStep === 'model' ? 'bg-primary-500' : 'bg-gray-200 dark:bg-slate-700'
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Step 1: Brands */}
              {mobileStep === 'brand' && (
                <div className="space-y-2">
                  {/* ✅ دستگاه‌های من — دسترسی سریع بدون طی کردن ویزارد */}
                  {isAuthenticated && devices.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <BookmarkCheck className="w-3 h-3" />
                        دستگاه‌های من ({devices.length})
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {devices.map((device) => {
                          const isSelected = selectedModel?.id === device.phone_model_id;
                          return (
                            <button
                              key={device.id}
                              onClick={() => handleSelectSavedDevice(device)}
                              className={cn(
                                'w-full flex items-center gap-2 p-2 rounded-lg text-right transition-all',
                                isSelected
                                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                              )}
                            >
                              <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {device.phone_model?.brand?.name} {device.phone_model?.name}
                                </p>
                                {device.nickname && (
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">📝 {device.nickname}</p>
                                )}
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {brandsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  ) : brands.length === 0 ? (
                    <div className="text-center py-12">
                      <Smartphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">برندی یافت نشد</p>
                    </div>
                  ) : (
                    brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => handleBrandSelect(brand)}
                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Smartphone className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="flex-1 text-right font-medium text-gray-900 dark:text-gray-100">
                          {brand.name}
                        </span>
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Step 2: Series */}
              {mobileStep === 'series' && (
                <div className="space-y-2">
                  <button
                    onClick={() => setMobileStep('brand')}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-3"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                    <span>بازگشت به برندها</span>
                  </button>

                  {seriesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  ) : series.length === 0 ? (
                    <div className="text-center py-12">
                      <Smartphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        سری برای این برند یافت نشد
                      </p>
                    </div>
                  ) : (
                    series.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSeriesSelect(s)}
                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {s.image ? (
                            <img
                              src={s.image}
                              alt={s.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Smartphone className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="flex-1 text-right font-medium text-gray-900 dark:text-gray-100">
                          {s.name}
                        </span>
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Step 3: Models */}
              {mobileStep === 'model' && (
                <div className="space-y-2">
                  <button
                    onClick={() => setMobileStep('series')}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-3"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                    <span>بازگشت به سری‌ها</span>
                  </button>

                  {modelsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  ) : models.length === 0 ? (
                    <div className="text-center py-12">
                      <Smartphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        مدلی برای این سری یافت نشد
                      </p>
                    </div>
                  ) : (
                    models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModelSelect(m)}
                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {m.image ? (
                            <img
                              src={m.image}
                              alt={m.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Smartphone className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="flex-1 text-right font-medium text-gray-900 dark:text-gray-100">
                          {m.name}
                        </span>
                        {selectedModel?.id === m.id && (
                          <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedModel && (
              <div className="border-t border-gray-200 dark:border-slate-700 p-4">
                <Button variant="outline" onClick={handleClear} className="w-full">
                  <X className="w-4 h-4 ml-2" />
                  پاک کردن انتخاب
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default DeviceSelector;