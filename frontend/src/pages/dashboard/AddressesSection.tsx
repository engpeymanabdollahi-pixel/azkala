import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Plus, Edit2, Trash2, CheckCircle, Star, X,
  Phone, User as UserIcon, Home, Building2, Package,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { addressService, type Address, type AddressFormData } from '@/services/api/address.service';

// لیست استان‌های ایران
const PROVINCES = [
  'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز',
  'ایلام', 'بوشهر', 'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی',
  'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان',
  'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان',
  'کرمان', 'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان',
  'لرستان', 'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد',
];

export function AddressesSection() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Address | null>(null);

  // Fetch addresses
  const { data, isLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: addressService.getAddresses,
  });

  const addresses = data?.data || [];
  const defaultAddress = addresses.find(a => a.is_default);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: addressService.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setShowFormModal(false);
      setEditingAddress(null);
      toast.success('آدرس با موفقیت اضافه شد', { icon: '📍' });
    },
    onError: () => toast.error('خطا در افزودن آدرس'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AddressFormData> }) =>
      addressService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setShowFormModal(false);
      setEditingAddress(null);
      toast.success('آدرس به‌روزرسانی شد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در ویرایش آدرس'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: addressService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setShowDeleteConfirm(null);
      toast.success('آدرس حذف شد', { icon: '🗑️' });
    },
    onError: () => toast.error('خطا در حذف آدرس'),
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: addressService.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success('آدرس پیش‌فرض تنظیم شد', { icon: '⭐' });
    },
    onError: () => toast.error('خطا در تنظیم آدرس پیش‌فرض'),
  });

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setShowFormModal(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setShowFormModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[1, 2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-600" />
            آدرس‌های من
          </h3>
          <p className="text-[11px] text-gray-600">{addresses.length} آدرس ثبت شده</p>
        </div>
        <Button size="xs" className="gap-1" onClick={handleAddNew}>
          <Plus className="w-3 h-3" />
          <span className="text-[10px]">آدرس جدید</span>
        </Button>
      </div>

      {/* Default Address Highlight */}
      {defaultAddress && (
        <div className="bg-gradient-to-l from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="font-black text-gray-900 text-sm">{defaultAddress.title}</h4>
                <Badge variant="primary" size="sm">پیش‌فرض</Badge>
              </div>
              <p className="text-[11px] text-gray-700 leading-relaxed">
                {defaultAddress.address}، {defaultAddress.city}، {defaultAddress.province}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                <span className="flex items-center gap-0.5">
                  <UserIcon className="w-2.5 h-2.5" />
                  {defaultAddress.full_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5" dir="ltr">
                  <Phone className="w-2.5 h-2.5" />
                  {defaultAddress.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={<MapPin className="w-12 h-12" />}
            title="هنوز آدرسی ثبت نکرده‌اید"
            description="آدرس خود را اضافه کنید تا در هنگام خرید سریع‌تر سفارش ثبت کنید"
            action={
              <Button onClick={handleAddNew} size="md">
                <Plus className="w-4 h-4 ml-1.5" />
                افزودن اولین آدرس
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                'relative p-3 rounded-xl border-2 transition-all hover:shadow-md',
                address.is_default
                  ? 'border-primary-300 bg-gradient-to-l from-primary-50/50 to-white'
                  : 'border-gray-100 bg-white hover:border-primary-200'
              )}
            >
              {address.is_default && (
                <Badge variant="primary" size="sm" className="absolute top-2 left-2">
                  <Star className="w-3 h-3 ml-0.5 fill-white" />
                  پیش‌فرض
                </Badge>
              )}

              <div className="flex items-start gap-2.5">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                  address.is_default
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                )}>
                  {address.title.toLowerCase().includes('خانه') || address.title.toLowerCase().includes('home') ? (
                    <Home className="w-4 h-4 text-white" />
                  ) : address.title.toLowerCase().includes('کار') || address.title.toLowerCase().includes('work') ? (
                    <Building2 className="w-4 h-4 text-white" />
                  ) : (
                    <MapPin className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 text-sm mb-0.5">{address.title}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                    {address.address}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {address.city}، {address.province}
                    {address.postal_code && ` - کد پستی: ${address.postal_code}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <UserIcon className="w-2.5 h-2.5" />
                      {address.full_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5" dir="ltr">
                      <Phone className="w-2.5 h-2.5" />
                      {address.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
                <Button variant="outline" size="xs" className="flex-1 gap-1" onClick={() => handleEdit(address)}>
                  <Edit2 className="w-3 h-3" />
                  <span className="text-[10px]">ویرایش</span>
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-primary-600 gap-1"
                    onClick={() => setDefaultMutation.mutate(address.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    <Star className="w-3 h-3" />
                    <span className="text-[10px]">پیش‌فرض</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-error-600"
                  onClick={() => setShowDeleteConfirm(address)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showFormModal && (
        <AddressFormModal
          address={editingAddress}
          onClose={() => { setShowFormModal(false); setEditingAddress(null); }}
          onSubmit={(data) => {
            if (editingAddress) {
              updateMutation.mutate({ id: editingAddress.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
          defaultFullName={user?.name || ''}
          defaultPhone={user?.phone || ''}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-scale-in">
            <div className="w-14 h-14 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-black text-gray-900 text-center mb-1.5">حذف آدرس؟</h3>
            <p className="text-gray-600 text-center text-sm mb-4">
              آیا مطمئن هستید که می‌خواهید آدرس "<strong>{showDeleteConfirm.title}</strong>" را حذف کنید؟
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" size="md" onClick={() => setShowDeleteConfirm(null)}>
                انصراف
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                size="md"
                onClick={() => deleteMutation.mutate(showDeleteConfirm.id)}
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Address Form Modal ====================
function AddressFormModal({
  address,
  onClose,
  onSubmit,
  isPending,
  defaultFullName,
  defaultPhone,
}: {
  address: Address | null;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => void;
  isPending: boolean;
  defaultFullName: string;
  defaultPhone: string;
}) {
  const [formData, setFormData] = useState<AddressFormData>({
    title: address?.title || 'خانه',
    full_name: address?.full_name || defaultFullName,
    phone: address?.phone || defaultPhone,
    province: address?.province || 'تهران',
    city: address?.city || '',
    address: address?.address || '',
    postal_code: address?.postal_code || '',
    is_default: address?.is_default || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'عنوان الزامی است';
    if (!formData.full_name.trim()) newErrors.full_name = 'نام گیرنده الزامی است';
    if (!formData.phone.trim()) newErrors.phone = 'شماره تماس الزامی است';
    else if (!/^09[0-9]{9}$/.test(formData.phone)) newErrors.phone = 'شماره موبایل نامعتبر است';
    if (!formData.province.trim()) newErrors.province = 'استان الزامی است';
    if (!formData.city.trim()) newErrors.city = 'شهر الزامی است';
    if (!formData.address.trim()) newErrors.address = 'آدرس الزامی است';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const titleOptions = [
    { value: 'خانه', icon: Home },
    { value: 'محل کار', icon: Building2 },
    { value: 'سایر', icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
            <MapPin className="w-5 h-5 text-primary-600" />
            {address ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">عنوان آدرس</label>
            <div className="flex gap-1.5">
              {titleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, title: option.value }))}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border-2 transition-all text-xs font-semibold',
                      formData.title === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                نام گیرنده <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500',
                  errors.full_name ? 'border-error-500' : 'border-gray-200'
                )}
                placeholder="نام و نام خانوادگی"
              />
              {errors.full_name && <p className="text-[10px] text-error-500 mt-0.5">{errors.full_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                شماره تماس <span className="text-error-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500',
                  errors.phone ? 'border-error-500' : 'border-gray-200'
                )}
                placeholder="09123456789"
                dir="ltr"
              />
              {errors.phone && <p className="text-[10px] text-error-500 mt-0.5">{errors.phone}</p>}
            </div>
          </div>

          {/* Province & City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                استان <span className="text-error-500">*</span>
              </label>
              <select
                value={formData.province}
                onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white',
                  errors.province ? 'border-error-500' : 'border-gray-200'
                )}
              >
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                شهر <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500',
                  errors.city ? 'border-error-500' : 'border-gray-200'
                )}
                placeholder="نام شهر"
              />
              {errors.city && <p className="text-[10px] text-error-500 mt-0.5">{errors.city}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              آدرس کامل <span className="text-error-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none',
                errors.address ? 'border-error-500' : 'border-gray-200'
              )}
              placeholder="خیابان، کوچه، پلاک، واحد..."
            />
            {errors.address && <p className="text-[10px] text-error-500 mt-0.5">{errors.address}</p>}
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">کد پستی</label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              placeholder="۱۲۳۴۵۶۷۸۹۰"
              dir="ltr"
            />
          </div>

          {/* Default Checkbox */}
          <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">تنظیم به عنوان آدرس پیش‌فرض</p>
              <p className="text-[10px] text-gray-500">در هنگام خرید، این آدرس به صورت خودکار انتخاب می‌شود</p>
            </div>
          </label>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50/50">
          <Button variant="outline" className="flex-1" size="md" onClick={onClose} disabled={isPending}>
            انصراف
          </Button>
          <Button
            className="flex-1"
            size="md"
            onClick={handleSubmit}
            disabled={isPending}
            isLoading={isPending}
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            {address ? 'ذخیره تغییرات' : 'افزودن آدرس'}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default AddressesSection;
