import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, CheckCircle2, XCircle, Hourglass, Store as StoreIcon, Search, Ban, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { adminStoreService, type AdminStoreFilters } from '@/services/api/adminStore.service';

/**
 * تایید/رد/فعال‌سازی فروشگاه‌های فیزیکی فروشندگان (Phase 16).
 * دسترسی این صفحه از طریق permission «stores.view/stores.manage» —
 * همان سیستم Multi-Admin موجود — gate می‌شود (middleware سمت بک‌اند و
 * فیلتر سایدبار سمت فرانت).
 */
export default function AdminStoresPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AdminStoreFilters['status'] | ''>('pending');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stores', status, search],
    queryFn: () => adminStoreService.list({ status: status || undefined, search: search || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-stores'] });

  const verifyMutation = useMutation({
    mutationFn: (id: number) => adminStoreService.verify(id),
    onSuccess: () => {
      invalidate();
      toast.success('فروشگاه تایید شد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تایید فروشگاه'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminStoreService.reject(id),
    onSuccess: () => {
      invalidate();
      toast.success('فروشگاه رد شد');
    },
    onError: () => toast.error('خطا در رد فروشگاه'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => adminStoreService.deactivate(id),
    onSuccess: () => {
      invalidate();
      toast.success('فروشگاه غیرفعال شد');
    },
    onError: () => toast.error('خطا در غیرفعال‌سازی'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => adminStoreService.activate(id),
    onSuccess: () => {
      invalidate();
      toast.success('فروشگاه فعال شد');
    },
    onError: () => toast.error('خطا در فعال‌سازی'),
  });

  const stores = data?.data ?? [];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          فروشگاه‌های فیزیکی
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          یک فروشگاه تا زمانی که تایید نشود، در جستجوی «نزدیک من» برای مشتریان نمایش داده نمی‌شود.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['pending', 'verified', ''] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              status === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            {s === 'pending' ? 'در انتظار تایید' : s === 'verified' ? 'تاییدشده' : 'همه'}
          </button>
        ))}

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نام/شهر..."
            className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && stores.length === 0 && (
        <EmptyState icon={<StoreIcon className="w-10 h-10" />} title="فروشگاهی یافت نشد" description="در این فیلتر هیچ فروشگاهی ثبت نشده است." />
      )}

      <div className="space-y-2">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{store.name}</p>
                {!store.is_active ? (
                  <Badge variant="gray" icon={<XCircle className="w-3 h-3" />}>غیرفعال</Badge>
                ) : store.verified_at ? (
                  <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>تاییدشده</Badge>
                ) : (
                  <Badge variant="warning" icon={<Hourglass className="w-3 h-3" />}>در انتظار</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {[store.city, store.address].filter(Boolean).join('، ') || 'آدرس ثبت نشده'}
              </p>
              {store.seller?.name && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">فروشنده: {store.seller.name}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!store.verified_at && (
                <>
                  <Button size="sm" onClick={() => verifyMutation.mutate(store.id)} disabled={verifyMutation.isPending}>
                    تایید
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate(store.id)} disabled={rejectMutation.isPending}>
                    رد
                  </Button>
                </>
              )}
              {store.verified_at && store.is_active && (
                <Button variant="outline" size="sm" onClick={() => deactivateMutation.mutate(store.id)} leftIcon={<Ban className="w-3.5 h-3.5" />}>
                  غیرفعال‌سازی
                </Button>
              )}
              {store.verified_at && !store.is_active && (
                <Button variant="outline" size="sm" onClick={() => activateMutation.mutate(store.id)} leftIcon={<Play className="w-3.5 h-3.5" />}>
                  فعال‌سازی
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
