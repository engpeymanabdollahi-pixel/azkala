import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Plus, Pencil, Trash2, Clock, Package, Phone,
  CheckCircle2, Hourglass, XCircle, Store as StoreIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { storeService, type StoreFormData } from '@/services/api/store.service';
import type { Store, StoreHour } from '@/types/models';

const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

const emptyForm: StoreFormData = {
  name: '',
  phone: '',
  province: '',
  city: '',
  address: '',
  latitude: null,
  longitude: null,
  is_active: true,
};

export default function SellerStores() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState<StoreFormData>(emptyForm);

  const [hoursStore, setHoursStore] = useState<Store | null>(null);
  const [hoursDraft, setHoursDraft] = useState<StoreHour[]>([]);

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['seller-stores'],
    queryFn: storeService.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: StoreFormData) => storeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stores'] });
      toast.success('فروشگاه ثبت شد و در انتظار تایید ادمین است', { icon: '🏬' });
      setFormOpen(false);
    },
    onError: () => toast.error('خطا در ثبت فروشگاه'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StoreFormData> }) => storeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stores'] });
      toast.success('فروشگاه به‌روزرسانی شد');
      setFormOpen(false);
      setEditingStore(null);
    },
    onError: () => toast.error('خطا در به‌روزرسانی فروشگاه'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => storeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stores'] });
      toast.success('فروشگاه حذف شد');
    },
    onError: () => toast.error('خطا در حذف فروشگاه'),
  });

  const hoursMutation = useMutation({
    mutationFn: ({ id, hours }: { id: number; hours: StoreHour[] }) => storeService.setHours(id, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stores'] });
      toast.success('ساعات کاری ذخیره شد');
      setHoursStore(null);
    },
    onError: () => toast.error('خطا در ذخیره‌ی ساعات کاری'),
  });

  const openCreate = () => {
    setEditingStore(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      phone: store.phone || '',
      province: store.province || '',
      city: store.city || '',
      address: store.address || '',
      latitude: store.latitude ?? null,
      longitude: store.longitude ?? null,
      is_active: store.is_active,
    });
    setFormOpen(true);
  };

  const openHours = (store: Store) => {
    setHoursStore(store);
    const existing = store.hours || [];
    setHoursDraft(
      WEEKDAYS.map((_, day) => existing.find((h) => h.day_of_week === day) || { day_of_week: day, opens_at: '', closes_at: '', is_closed: true })
    );
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('نام فروشگاه الزامی است');
      return;
    }
    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (store: Store) => {
    if (!confirm(`فروشگاه «${store.name}» حذف شود؟`)) return;
    deleteMutation.mutate(store.id);
  };

  const statusBadge = (store: Store) => {
    if (!store.is_active) return <Badge variant="gray" icon={<XCircle className="w-3 h-3" />}>غیرفعال</Badge>;
    if (store.verified_at) return <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>تاییدشده</Badge>;
    return <Badge variant="warning" icon={<Hourglass className="w-3 h-3" />}>در انتظار تایید</Badge>;
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            فروشگاه‌های فیزیکی
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            شعبه‌های فیزیکی خود را ثبت کنید تا مشتریان نزدیک بتوانند محصولات موجود در آن‌ها را در صفحه محصول ببینند.
          </p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          افزودن فروشگاه
        </Button>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />
        </div>
      )}

      {!isLoading && stores.length === 0 && (
        <EmptyState
          icon={<StoreIcon className="w-10 h-10" />}
          title="هنوز فروشگاه فیزیکی ثبت نکرده‌اید"
          description="با افزودن فروشگاه، محصولاتی که در آن موجود هستند برای مشتریان نزدیک قابل‌مشاهده خواهند بود."
          action={<Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>افزودن اولین فروشگاه</Button>}
        />
      )}

      <div className="space-y-3">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{store.name}</p>
                {statusBadge(store)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {[store.city, store.address].filter(Boolean).join('، ') || 'آدرس ثبت نشده'}
              </p>
              {store.phone && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  {store.phone}
                </p>
              )}
              {(!store.latitude || !store.longitude) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  مختصات جغرافیایی ثبت نشده — این فروشگاه در جستجوی «نزدیک من» نمایش داده نمی‌شود.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate(`/seller/stores/${store.id}/inventory`)} leftIcon={<Package className="w-3.5 h-3.5" />}>
                موجودی
              </Button>
              <Button variant="outline" size="sm" onClick={() => openHours(store)} leftIcon={<Clock className="w-3.5 h-3.5" />}>
                ساعات کاری
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(store)} leftIcon={<Pencil className="w-3.5 h-3.5" />}>
                ویرایش
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(store)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingStore ? 'ویرایش فروشگاه' : 'افزودن فروشگاه'} size="lg">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">نام فروشگاه *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">استان</label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">شهر</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">آدرس</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">تلفن</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">عرض جغرافیایی (Latitude)</label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) => setForm({ ...form, latitude: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">طول جغرافیایی (Longitude)</label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) => setForm({ ...form, longitude: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            بدون ثبت مختصات، این فروشگاه در جستجوی «فروشگاه‌های نزدیک» نمایش داده نمی‌شود.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            فروشگاه فعال است
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>انصراف</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingStore ? 'ذخیره تغییرات' : 'ثبت فروشگاه'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hours Modal */}
      <Modal isOpen={!!hoursStore} onClose={() => setHoursStore(null)} title={`ساعات کاری — ${hoursStore?.name ?? ''}`} size="lg">
        <div className="space-y-2">
          {hoursDraft.map((h, idx) => (
            <div key={h.day_of_week} className="flex items-center gap-2">
              <span className="w-16 text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">{WEEKDAYS[idx]}</span>
              <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={!h.is_closed}
                  onChange={(e) => {
                    const next = [...hoursDraft];
                    next[idx] = { ...h, is_closed: !e.target.checked };
                    setHoursDraft(next);
                  }}
                />
                باز
              </label>
              <input
                type="time"
                disabled={h.is_closed}
                value={h.opens_at || ''}
                onChange={(e) => {
                  const next = [...hoursDraft];
                  next[idx] = { ...h, opens_at: e.target.value };
                  setHoursDraft(next);
                }}
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs disabled:opacity-40"
              />
              <span className="text-xs text-gray-400">تا</span>
              <input
                type="time"
                disabled={h.is_closed}
                value={h.closes_at || ''}
                onChange={(e) => {
                  const next = [...hoursDraft];
                  next[idx] = { ...h, closes_at: e.target.value };
                  setHoursDraft(next);
                }}
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs disabled:opacity-40"
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setHoursStore(null)}>انصراف</Button>
            <Button
              onClick={() => hoursStore && hoursMutation.mutate({ id: hoursStore.id, hours: hoursDraft })}
              disabled={hoursMutation.isPending}
            >
              ذخیره ساعات کاری
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
