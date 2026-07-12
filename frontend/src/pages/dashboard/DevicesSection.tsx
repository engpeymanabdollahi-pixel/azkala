import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone, Plus, X, Trash2, Package, ShoppingCart,
  Zap, Sparkles, ChevronLeft, Star, CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/client';

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

interface CompatibleProduct {
  id: number;
  name: string;
  slug: string;
  main_image: string;
  price: number;
  discount_price: number | null;
  stock: number;
  rating: number;
  reviews_count: number;
  is_special_offer: boolean;
}

const fetchUserDevices = async (): Promise<{ success: boolean; data: UserDevice[] }> => {
  try {
    const response = await apiClient.get('/user/devices');
    return response.data;
  } catch {
    return { success: false, data: [] };
  }
};

const fetchCompatibleProducts = async (modelId: number): Promise<{ success: boolean; data: CompatibleProduct[] }> => {
  try {
    const response = await apiClient.get(`/products/compatible/${modelId}`);
    return response.data;
  } catch {
    return { success: false, data: [] };
  }
};

const addUserDevice = async (phoneModelId: number, nickname?: string) => {
  const response = await apiClient.post('/user/devices', {
    phone_model_id: phoneModelId,
    nickname,
  });
  return response.data;
};

const deleteUserDevice = async (deviceId: number) => {
  const response = await apiClient.delete(`/user/devices/${deviceId}`);
  return response.data;
};

const fetchBrands = async () => {
  const response = await apiClient.get('/devices/brands');
  return response.data.data;
};

const fetchSeries = async (brandId: number) => {
  const response = await apiClient.get(`/devices/brands/${brandId}/series`);
  return response.data.data;
};

const fetchModels = async (seriesId: number) => {
  const response = await apiClient.get(`/devices/series/${seriesId}/models`);
  return response.data.data;
};

export function DevicesSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<UserDevice | null>(null);
  const [nickname, setNickname] = useState('');

  const { data: devicesData, isLoading } = useQuery({
    queryKey: ['user-devices'],
    queryFn: fetchUserDevices,
  });

  const devices = devicesData?.data || [];

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['compatible-products', selectedDevice?.phone_model_id],
    queryFn: () => fetchCompatibleProducts(selectedDevice!.phone_model_id),
    enabled: !!selectedDevice,
  });

  const products = productsData?.data || [];

  const addMutation = useMutation({
    mutationFn: ({ modelId, nickname }: { modelId: number; nickname?: string }) => 
      addUserDevice(modelId, nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
      setShowAddModal(false);
      setNickname('');
      toast.success('دستگاه اضافه شد', { icon: '📱' });
    },
    onError: () => toast.error('خطا در افزودن دستگاه'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
      setSelectedDevice(null);
      toast.success('دستگاه حذف شد', { icon: '🗑️' });
    },
    onError: () => toast.error('خطا در حذف دستگاه'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-primary-600" />
            دستگاه‌های من
          </h3>
          <p className="text-[11px] text-gray-600">{devices.length} دستگاه ثبت شده</p>
        </div>
        <Button size="xs" className="gap-1" onClick={() => setShowAddModal(true)}>
          <Plus className="w-3 h-3" />
          <span className="text-[10px]">افزودن دستگاه</span>
        </Button>
      </div>

      <div className="bg-gradient-to-l from-primary-50 to-accent-50 border border-primary-100 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-900 mb-0.5">دستگاه خود را اضافه کنید</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              با افزودن دستگاه، محصولات ۱۰۰٪ سازگار و تخفیف‌های ویژه را مشاهده کنید.
            </p>
          </div>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
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
                'bg-white rounded-xl border-2 p-3 transition-all cursor-pointer hover:shadow-md',
                selectedDevice?.id === device.id
                  ? 'border-primary-500 shadow-md'
                  : 'border-gray-100 hover:border-primary-200'
              )}
              onClick={() => setSelectedDevice(selectedDevice?.id === device.id ? null : device)}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-11 h-11 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 text-sm truncate">
                    {device.phone_model?.brand?.name} {device.phone_model?.name}
                  </h4>
                  {device.nickname && (
                    <p className="text-[10px] text-gray-500 mb-0.5">📝 {device.nickname}</p>
                  )}
                  {device.phone_model?.series && (
                    <p className="text-[10px] text-gray-500">سری: {device.phone_model.series.name}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('آیا از حذف این دستگاه مطمئن هستید؟')) {
                      deleteMutation.mutate(device.id);
                    }
                  }}
                  className="p-1.5 hover:bg-error-50 rounded-lg text-gray-400 hover:text-error-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
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

      {selectedDevice && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-600" />
                  محصولات سازگار با {selectedDevice.phone_model?.brand?.name} {selectedDevice.phone_model?.name}
                </h4>
                <p className="text-[11px] text-gray-600 mt-0.5">{products.length} محصول ۱۰۰٪ سازگار</p>
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
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">هنوز محصولی برای این دستگاه ثبت نشده</p>
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
                    className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      <img
                        src={product.main_image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform"
                      />
                      {discountPercent > 0 && (
                        <Badge variant="error" size="sm" className="absolute top-1.5 right-1.5 shadow-sm">
                          <Zap className="w-2.5 h-2.5" />
                          {discountPercent}٪
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <h5 className="font-bold text-gray-900 text-[11px] line-clamp-2 mb-1 min-h-[1.75rem]">
                        {product.name}
                      </h5>
                      {product.rating > 0 && (
                        <div className="flex items-center gap-0.5 mb-1">
                          <Star className="w-2.5 h-2.5 text-warning-400 fill-warning-400" />
                          <span className="text-[10px] text-gray-500">{product.rating}</span>
                        </div>
                      )}
                      <div className="flex items-end justify-between">
                        <div>
                          {product.discount_price && (
                            <span className="text-[10px] text-gray-400 line-through block">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          <span className="text-xs font-black text-primary-700">
                            {formatPrice(product.discount_price || product.price)}
                          </span>
                        </div>
                        {product.stock > 0 ? (
                          <Button 
                            size="xs" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success('به سبد اضافه شد', { icon: '🛒' });
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

      {showAddModal && (
        <AddDeviceModal
          onClose={() => { setShowAddModal(false); setNickname(''); }}
          onAdd={(modelId) => addMutation.mutate({ modelId, nickname: nickname || undefined })}
          nickname={nickname}
          setNickname={setNickname}
          isPending={addMutation.isPending}
        />
      )}
    </div>
  );
}

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
  const [step, setStep] = useState<'brand' | 'series' | 'model'>('brand');
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
            <Smartphone className="w-5 h-5 text-primary-600" />
            افزودن دستگاه جدید
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
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
                    : 'bg-gray-200'
                )} />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">نام دلخواه برای دستگاه (اختیاری)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثلاً: گوشی من"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {step === 'brand' && (
            <div>
              <h4 className="text-sm font-black text-gray-900 mb-2">برند دستگاه را انتخاب کنید</h4>
              {brandsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {brands?.map((brand: any) => (
                    <button
                      key={brand.id}
                      onClick={() => { setSelectedBrand(brand.id); setStep('series'); }}
                      className="p-3 bg-white border-2 border-gray-100 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all text-center"
                    >
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="w-10 h-10 mx-auto mb-1 object-contain" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg mx-auto mb-1 flex items-center justify-center text-white font-black">
                          {brand.name[0]}
                        </div>
                      )}
                      <p className="text-[11px] font-bold text-gray-900">{brand.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'series' && (
            <div>
              <button onClick={() => setStep('brand')} className="text-xs text-primary-600 mb-2 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 rotate-180" />
                بازگشت به برندها
              </button>
              <h4 className="text-sm font-black text-gray-900 mb-2">سری دستگاه را انتخاب کنید</h4>
              {seriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {series?.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSeries(s.id); setStep('model'); }}
                      className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all text-right flex items-center justify-between"
                    >
                      <span className="font-bold text-gray-900 text-sm">{s.name}</span>
                      <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'model' && (
            <div>
              <button onClick={() => setStep('series')} className="text-xs text-primary-600 mb-2 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 rotate-180" />
                بازگشت به سری‌ها
              </button>
              <h4 className="text-sm font-black text-gray-900 mb-2">مدل دقیق دستگاه را انتخاب کنید</h4>
              {modelsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {models?.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={cn(
                        'w-full p-3 border-2 rounded-lg transition-all text-right flex items-center justify-between',
                        selectedModel === m.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-100 hover:border-primary-300'
                      )}
                    >
                      <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                      {selectedModel === m.id && <CheckCircle className="w-4 h-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
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