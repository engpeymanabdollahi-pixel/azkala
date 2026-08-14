import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone, Plus, X, Trash2, Package, ShoppingCart, Pencil,
  Zap, Sparkles, ChevronLeft, Star, CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/client';
import type { Product } from '@/types/models';
import { useModelStore } from '@/store/modelStore';
import { useUserDevices } from '@/hooks/useUserDevices';

interface UserDevice {
  id: number;
  user_id: number;
  phone_model_id: number;
  nickname?: string;
  phone_model?: {
    id: number;
    name: string;
    brand?: { id: number; name: string };
    series?: { id: number; name: string };
  };
}

type CompatibleProduct = Product & {
  discount_price: number | null;
  is_special_offer: boolean;
};

interface DeviceBrandOption {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  series_count: number;
}
interface DeviceSeriesOption {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  models_count: number;
}
interface DeviceModelOption {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  release_year: number | null;
}

// ==================== Helper Fetch Functions ====================
const fetchCompatibleProducts = async (modelId: number): Promise<CompatibleProduct[]> => {
  try {
    const response = await apiClient.get(`/products/compatible/${modelId}`);
    return response.data?.data || response.data || [];
  } catch {
    return [];
  }
};

const fetchBrands = async (): Promise<DeviceBrandOption[]> => {
  const response = await apiClient.get('/devices/brands');
  return response.data?.data || [];
};

const fetchSeries = async (brandId: number): Promise<DeviceSeriesOption[]> => {
  const response = await apiClient.get(`/devices/brands/${brandId}/series`);
  return response.data?.data || [];
};

const fetchModels = async (seriesId: number): Promise<DeviceModelOption[]> => {
  const response = await apiClient.get(`/devices/series/${seriesId}/models`);
  return response.data?.data || [];
};

// ==================== Main Component ====================
export function DevicesSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem: addToCart } = useCartStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<UserDevice | null>(null);
  const [nickname, setNickname] = useState('');
  const [editingDevice, setEditingDevice] = useState<UserDevice | null>(null);
  const [editNickname, setEditNickname] = useState('');

  // ✅ Hook مشترک - sync خودکار با Header
  const {
    devices,
    isLoading,
    addDevice,
    removeDevice,
    isAdding,
  } = useUserDevices();

  // ✅ Query محصولات سازگار با دستگاه انتخابی
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['compatible-products', selectedDevice?.phone_model_id],
    queryFn: () => fetchCompatibleProducts(selectedDevice!.phone_model_id),
    enabled: !!selectedDevice,
  });

  // ✅ Mutation ویرایش نام دستگاه
  const updateMutation = useMutation({
    mutationFn: async ({ deviceId, nickname }: { deviceId: number; nickname?: string }) => {
      const response = await apiClient.put(`/user/devices/${deviceId}`, { nickname });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
      setEditingDevice(null);
      setEditNickname('');
      toast.success('نام دستگاه به‌روزرسانی شد', { icon: '✏️' });
    },
    onError: () => toast.error('خطا در به‌روزرسانی دستگاه'),
  });

  // ✅ افزودن به سبد خرید واقعی
  const handleAddToCart = (product: CompatibleProduct) => {
    if (product.stock === 0) {
      toast.error('محصول موجود نیست');
      return;
    }
    addToCart(product, 1);
    toast.success('به سبد اضافه شد', { icon: '🛒' });
  };

  // ✅ حذف دستگاه (با استفاده از hook مشترک)
  const handleRemoveDevice = async (deviceId: number) => {
    if (window.confirm('آیا از حذف این دستگاه مطمئن هستید؟')) {
      const success = await removeDevice(deviceId);
      if (success && selectedDevice?.id === deviceId) {
        setSelectedDevice(null);
      }
    }
  };

  // ==================== Loading State ====================
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ==================== Main Render ====================
  return (
    <div className="space-y-3">
      {/* Header Card */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
        <div>
          <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            دستگاه‌های من
          </h3>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">{devices.length} دستگاه ثبت شده</p>
        </div>
        <Button size="xs" className="gap-1" onClick={() => setShowAddModal(true)}>
          <Plus className="w-3 h-3" />
          <span className="text-[10px]">افزودن دستگاه</span>
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-l from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">دستگاه خود را اضافه کنید</p>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              با افزودن دستگاه، محصولات ۱۰۰٪ سازگار و تخفیف‌های ویژه را مشاهده کنید.
            </p>
          </div>
        </div>
      </div>

      {/* Empty State یا List */}
      {devices.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
          <EmptyState
            icon={<Smartphone className="w-12 h-12" />}
            title="هنوز دستگاهی اضافه نکرده‌اید"
            description="دستگاه خود را اضافه کنید تا محصولات سازگار را ببینید"
            action={
              <Button onClick={() => setShowAddModal(true)} size="md">
                <Plus className="w-4 h-4 ml-1.5" />
                افزودن اولین دستگاه
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {devices.map((device) => (
            <div
              key={device.id}
              className={cn(
                'bg-white dark:bg-slate-800 rounded-xl border-2 p-3 transition-all cursor-pointer hover:shadow-md',
                selectedDevice?.id === device.id
                  ? 'border-primary-500 shadow-md'
                  : 'border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
              )}
              onClick={() => setSelectedDevice(selectedDevice?.id === device.id ? null : device)}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-11 h-11 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm truncate">
                    {device.phone_model?.brand?.name} {device.phone_model?.name}
                  </h4>
                  {device.nickname && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">📝 {device.nickname}</p>
                  )}
                  {device.phone_model?.series && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">سری: {device.phone_model.series.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDevice(device);
                      setEditNickname(device.nickname || '');
                    }}
                    className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="ویرایش نام دستگاه"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDevice(device.id);
                    }}
                    className="p-1.5 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg text-gray-400 dark:text-gray-500 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                    title="حذف دستگاه"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <Package className="w-3 h-3" />
                  <span>محصولات سازگار</span>
                </div>
                <Badge variant="primary" size="sm">
                  {selectedDevice?.id === device.id ? 'انتخاب شده' : 'مشاهده'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compatible Products Section */}
      {selectedDevice && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-primary-50/50 to-white dark:from-primary-900/10 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  محصولات سازگار با {selectedDevice.phone_model?.brand?.name} {selectedDevice.phone_model?.name}
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{products.length} محصول ۱۰۰٪ سازگار</p>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate(`/products?model=${selectedDevice.phone_model_id}`)}
                className="gap-1"
              >
                <span className="text-[10px]">مشاهده همه</span>
                <ChevronLeft className="w-3 h-3 rotate-180" />
              </Button>
            </div>
          </div>

          {productsLoading ? (
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">هنوز محصولی برای این دستگاه ثبت نشده</p>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {products.slice(0, 8).map((product) => {
                const discountPercent = product.discount_price && product.price > product.discount_price
                  ? Math.round(((product.price - product.discount_price) / product.price) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.slug}`)}
                    className="group bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 overflow-hidden">
                      <SafeImage
                        src={product.main_image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform"
                        showEmojiOnError
                        fallbackEmoji="📦"
                      />
                      {discountPercent > 0 && (
                        <Badge variant="error" size="sm" className="absolute top-1.5 right-1.5 shadow-sm">
                          <Zap className="w-2.5 h-2.5" />
                          {discountPercent}٪
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <h5 className="font-bold text-gray-900 dark:text-gray-100 text-[11px] line-clamp-2 mb-1 min-h-[1.75rem]">
                        {product.name}
                      </h5>
                      {!!product.rating && product.rating > 0 && (
                        <div className="flex items-center gap-0.5 mb-1">
                          <Star className="w-2.5 h-2.5 text-warning-400 fill-warning-400" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{product.rating}</span>
                        </div>
                      )}
                      <div className="flex items-end justify-between">
                        <div>
                          {product.discount_price && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through block">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          <span className="text-xs font-black text-primary-700 dark:text-primary-400">
                            {formatPrice(product.discount_price || product.price)}
                          </span>
                        </div>
                        {product.stock > 0 ? (
                          <Button
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="gap-0.5"
                          >
                            <ShoppingCart className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Badge variant="gray" size="sm">ناموجود</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Device Modal */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          nickname={editNickname}
          setNickname={setEditNickname}
          onClose={() => { setEditingDevice(null); setEditNickname(''); }}
          onSave={() => updateMutation.mutate({ deviceId: editingDevice.id, nickname: editNickname.trim() || undefined })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => { setShowAddModal(false); setNickname(''); }}
          onAdd={async (modelId) => {
            const success = await addDevice(modelId, nickname || undefined);
            if (success) {
              setShowAddModal(false);
              setNickname('');
            }
          }}
          nickname={nickname}
          setNickname={setNickname}
          isPending={isAdding}
        />
      )}
    </div>
  );
}

// ==================== AddDeviceModal ====================
function AddDeviceModal({
  onClose,
  onAdd,
  nickname,
  setNickname,
  isPending
}: {
  onClose: () => void;
  onAdd: (modelId: number) => void;
  nickname: string;
  setNickname: (v: string) => void;
  isPending: boolean;
}) {
  // ✅ Pre-select از Header
  const storeSelectedBrand = useModelStore((s) => s.selectedBrand);
  const storeSelectedSeries = useModelStore((s) => s.selectedSeries);
  const storeSelectedModel = useModelStore((s) => s.selectedModel);

  const [step, setStep] = useState<'brand' | 'series' | 'model'>(
    storeSelectedModel ? 'model' : storeSelectedSeries ? 'series' : 'brand'
  );
  const [selectedBrand, setSelectedBrand] = useState<number | null>(storeSelectedBrand?.id ?? null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(storeSelectedSeries?.id ?? null);
  const [selectedModel, setSelectedModel] = useState<number | null>(storeSelectedModel?.id ?? null);

  // Sync با store وقتی تغییر کرد
  useEffect(() => {
    if (storeSelectedBrand?.id && selectedBrand === null) {
      setSelectedBrand(storeSelectedBrand.id);
      if (step === 'brand') setStep('series');
    }
    if (storeSelectedSeries?.id && selectedSeries === null) {
      setSelectedSeries(storeSelectedSeries.id);
      if (step === 'brand' || step === 'series') setStep('model');
    }
    if (storeSelectedModel?.id && selectedModel === null) {
      setSelectedModel(storeSelectedModel.id);
      setStep('model');
    }
  }, [storeSelectedBrand, storeSelectedSeries, storeSelectedModel]);

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['device-brands'],
    queryFn: fetchBrands,
  });

  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ['device-series', selectedBrand],
    queryFn: () => fetchSeries(selectedBrand!),
    enabled: !!selectedBrand,
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['device-models', selectedSeries],
    queryFn: () => fetchModels(selectedSeries!),
    enabled: !!selectedSeries,
  });

  const handleAdd = () => {
    if (selectedModel) {
      onAdd(selectedModel);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            افزودن دستگاه جدید
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-1 mb-4">
            {['brand', 'series', 'model'].map((s, idx) => (
              <div key={s} className="flex-1">
                <div className={cn(
                  'h-1.5 rounded-full transition-all',
                  ['brand', 'series', 'model'].indexOf(step) >= idx
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                    : 'bg-gray-200 dark:bg-slate-700'
                )} />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام دلخواه برای دستگاه (اختیاری)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثلاً: گوشی من"
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {step === 'brand' && (
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-2">برند دستگاه را انتخاب کنید</h4>
              {brandsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : brands && brands.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => { setSelectedBrand(brand.id); setStep('series'); }}
                      className="p-3 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all text-center"
                    >
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="w-10 h-10 mx-auto mb-1 object-contain" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg mx-auto mb-1 flex items-center justify-center text-white font-black">
                          {brand.name[0]}
                        </div>
                      )}
                      <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{brand.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">برندی برای انتخاب موجود نیست</p>
              )}
            </div>
          )}

          {step === 'series' && (
            <div>
              <button onClick={() => setStep('brand')} className="text-xs text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 rotate-180" />
                بازگشت به برندها
              </button>
              <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-2">سری دستگاه را انتخاب کنید</h4>
              {seriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {series?.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSeries(s.id); setStep('model'); }}
                      className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all text-right flex items-center justify-between"
                    >
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{s.name}</span>
                      <ChevronLeft className="w-4 h-4 text-gray-400 dark:text-gray-500 rotate-180" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'model' && (
            <div>
              <button onClick={() => setStep('series')} className="text-xs text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 rotate-180" />
                بازگشت به سری‌ها
              </button>
              <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-2">مدل دقیق دستگاه را انتخاب کنید</h4>
              {modelsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {models?.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={cn(
                        'w-full p-3 border-2 rounded-lg transition-all text-right flex items-center justify-between',
                        selectedModel === m.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'
                      )}
                    >
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{m.name}</span>
                      {selectedModel === m.id && <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={onClose}>انصراف</Button>
          <Button
            className="flex-1"
            size="md"
            onClick={handleAdd}
            disabled={!selectedModel || isPending}
            isLoading={isPending}
          >
            <Plus className="w-4 h-4 ml-1" />
            افزودن دستگاه
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== EditDeviceModal ====================
function EditDeviceModal({
  device,
  nickname,
  setNickname,
  onClose,
  onSave,
  isPending
}: {
  device: UserDevice;
  nickname: string;
  setNickname: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <Pencil className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            ویرایش دستگاه
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {device.phone_model?.brand?.name} {device.phone_model?.name}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام دلخواه دستگاه</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثلاً: گوشی من"
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={onClose}>انصراف</Button>
          <Button className="flex-1" size="md" onClick={onSave} disabled={isPending}>
            {isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DevicesSection;