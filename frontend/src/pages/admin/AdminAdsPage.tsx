import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Search, RefreshCw, Plus, Edit2, Trash2,
  Eye, EyeOff, Loader2, AlertCircle, X, Image as ImageIcon,
  ExternalLink, Calendar, ArrowUpDown,
} from 'lucide-react';
import { adService } from '@/services/api/ad.service';
import type { Ad, AdFormData } from '@/services/api/ad.service';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

// ==================== Constants ====================

const POSITIONS = [
  { key: 'all', label: 'همه موقعیت‌ها' },
  { key: 'sidebar', label: 'ستون کناری' },
  { key: 'between_articles', label: 'بین مقالات' },
  { key: 'footer', label: 'فوتر' },
];

const STATUS_FILTER = [
  { key: 'all', label: 'همه' },
  { key: 'active', label: 'فعال' },
  { key: 'inactive', label: 'غیرفعال' },
];

const POSITION_LABELS: Record<string, string> = {
  sidebar: 'ستون کناری',
  between_articles: 'بین مقالات',
  footer: 'فوتر',
};

const emptyForm: AdFormData = {
  title: '',
  image_url: '',
  link_url: '',
  position: 'sidebar',
  is_active: true,
  priority: 0,
  starts_at: '',
  expires_at: '',
};

// ==================== Component ====================

export default function AdminAdsPage() {
  const queryClient = useQueryClient();

  // Filters
  const [filters, setFilters] = useState<{
    page: number;
    position?: string;
    is_active?: boolean;
    search?: string;
    sort_by: string;
    sort_dir: 'asc' | 'desc';
  }>({
    page: 1,
    position: undefined,
    is_active: undefined,
    search: '',
    sort_by: 'priority',
    sort_dir: 'desc',
  });

  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [deletingAd, setDeletingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<AdFormData>(emptyForm);

  // ==================== Queries ====================

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-ads', filters],
    queryFn: () => adService.getAds({
      page: filters.page,
      per_page: 20,
      position: filters.position,
      is_active: filters.is_active,
      sort_by: filters.sort_by,
      sort_dir: filters.sort_dir,
    }),
  });

  const ads = data?.data ?? [];
  const meta = data?.meta;

  // ==================== Mutations ====================

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adService.toggleAd(id),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adService.deleteAd(id),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      setShowDeleteModal(false);
      setDeletingAd(null);
    },
    onError: () => toast.error('خطا در حذف'),
  });

  const createMutation = useMutation({
    mutationFn: (data: AdFormData) => adService.createAd(data),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowFormModal(false);
      setFormData(emptyForm);
      setEditingAd(null);
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
    onError: () => toast.error('خطا در ایجاد آگهی'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdFormData> }) =>
      adService.updateAd(id, data),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowFormModal(false);
      setFormData(emptyForm);
      setEditingAd(null);
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
    onError: () => toast.error('خطا در ویرایش'),
  });

  // ==================== Handlers ====================

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      page: 1,
      search: '',
      sort_by: 'priority',
      sort_dir: 'desc',
    });
    setSearchInput('');
  }, []);

  const openCreate = useCallback(() => {
    setEditingAd(null);
    setFormData(emptyForm);
    setShowFormModal(true);
  }, []);

  const openEdit = useCallback((ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url,
      position: ad.position,
      is_active: ad.is_active,
      priority: ad.priority,
      starts_at: ad.starts_at || '',
      expires_at: ad.expires_at || '',
    });
    setShowFormModal(true);
  }, []);

  const openDelete = useCallback((ad: Ad) => {
    setDeletingAd(ad);
    setShowDeleteModal(true);
  }, []);

  const handleSubmitForm = useCallback(() => {
    if (!formData.title.trim()) {
      toast.error('عنوان الزامی است');
      return;
    }
    if (!formData.image_url.trim()) {
      toast.error('آدرس تصویر الزامی است');
      return;
    }
    if (!formData.link_url.trim()) {
      toast.error('آدرس لینک الزامی است');
      return;
    }

    const payload = {
      ...formData,
      starts_at: formData.starts_at || undefined,
      expires_at: formData.expires_at || undefined,
    };

    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [formData, editingAd, createMutation, updateMutation]);

  // Stats
  const stats = useMemo(() => {
    const all = ads;
    return {
      total: meta?.total ?? 0,
      active: all.filter((a) => a.is_active).length,
      inactive: all.filter((a) => !a.is_active).length,
      sidebar: all.filter((a) => a.position === 'sidebar').length,
    };
  }, [ads, meta]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            مدیریت تبلیغات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت آگهی‌های نمایشی در ستون کناری و بین مقالات مجله
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            تازه‌سازی
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            آگهی جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Megaphone} label="کل آگهی‌ها" value={stats.total} color="blue" />
        <StatCard icon={Eye} label="فعال" value={stats.active} color="green" />
        <StatCard icon={EyeOff} label="غیرفعال" value={stats.inactive} color="gray" />
        <StatCard icon={ImageIcon} label="ستون کناری" value={stats.sidebar} color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در عنوان..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filters.position ?? 'all'}
            onChange={(e) => setFilters((f) => ({ ...f, position: e.target.value === 'all' ? undefined : e.target.value, page: 1 }))}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
          >
            {POSITIONS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <select
            value={filters.is_active === true ? 'active' : filters.is_active === false ? 'inactive' : 'all'}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                is_active: e.target.value === 'active' ? true : e.target.value === 'inactive' ? false : undefined,
                page: 1,
              }))
            }
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
          >
            {STATUS_FILTER.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium"
          >
            جستجو
          </button>
          {(filters.position || filters.is_active !== undefined || filters.search) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm"
            >
              حذف فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        )}

        {!isLoading && ads.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            آگهی‌ای یافت نشد
          </div>
        )}

        {!isLoading && ads.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {ads.map((ad) => (
              <AdRow
                key={ad.id}
                ad={ad}
                onToggle={() => toggleMutation.mutate(ad.id)}
                onEdit={() => openEdit(ad)}
                onDelete={() => openDelete(ad)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              صفحه {meta.current_page} از {meta.last_page} ({meta.total} آگهی)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={meta.current_page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-slate-700 disabled:opacity-40"
              >
                قبلی
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(meta.last_page, f.page + 1) }))}
                disabled={meta.current_page === meta.last_page}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-slate-700 disabled:opacity-40"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <AdFormModal
          mode={editingAd ? 'edit' : 'create'}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setShowFormModal(false);
            setEditingAd(null);
            setFormData(emptyForm);
          }}
          onSubmit={handleSubmitForm}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingAd && (
        <DeleteConfirmModal
          ad={deletingAd}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingAd(null);
          }}
          onConfirm={() => deleteMutation.mutate(deletingAd.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    gray: 'from-gray-400 to-gray-500 shadow-gray-400/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', colorMap[color])}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
          <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            {value.toLocaleString('fa-IR')}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdRow({
  ad,
  onToggle,
  onEdit,
  onDelete,
}: {
  ad: Ad;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors items-center">
      {/* Image + Title */}
      <div className="md:col-span-5 flex items-start gap-3">
        <img
          src={ad.image_url}
          alt={ad.title}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1">
            {ad.title}
          </h3>
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 truncate"
          >
            <ExternalLink className="w-3 h-3" />
            {ad.link_url}
          </a>
        </div>
      </div>

      {/* Position */}
      <div className="md:col-span-2">
        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          {POSITION_LABELS[ad.position] || ad.position}
        </span>
      </div>

      {/* Priority */}
      <div className="md:col-span-1 text-center">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {ad.priority}
        </span>
      </div>

      {/* Status */}
      <div className="md:col-span-2">
        <button
          onClick={onToggle}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors',
            ad.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200'
          )}
        >
          {ad.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {ad.is_active ? 'فعال' : 'غیرفعال'}
        </button>
      </div>

      {/* Actions */}
      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 transition-colors"
          title="ویرایش"
        >
          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 hover:bg-red-200 transition-colors"
          title="حذف"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}

function AdFormModal({
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  mode: 'create' | 'edit';
  formData: AdFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdFormData>>;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            {mode === 'create' ? 'آگهی جدید' : 'ویرایش آگهی'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <FormField label="عنوان *">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </FormField>

          <FormField label="آدرس تصویر *">
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://example.com/ad.jpg"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="پیش‌نمایش"
                className="mt-2 w-40 h-28 rounded-lg object-cover border border-gray-200 dark:border-slate-700"
              />
            )}
          </FormField>

          <FormField label="آدرس لینک *">
            <input
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData((f) => ({ ...f, link_url: e.target.value }))}
              placeholder="https://azkala.com/..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="موقعیت">
              <select
                value={formData.position}
                onChange={(e) => setFormData((f) => ({ ...f, position: e.target.value as any }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
              >
                {POSITIONS.filter((p) => p.key !== 'all').map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="اولویت">
              <input
                type="number"
                value={formData.priority ?? 0}
                onChange={(e) => setFormData((f) => ({ ...f, priority: Number(e.target.value) }))}
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="تاریخ شروع">
              <input
                type="datetime-local"
                value={formData.starts_at || ''}
                onChange={(e) => setFormData((f) => ({ ...f, starts_at: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </FormField>
            <FormField label="تاریخ پایان">
              <input
                type="datetime-local"
                value={formData.expires_at || ''}
                onChange={(e) => setFormData((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData((f) => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              فعال باشد
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-medium"
          >
            انصراف
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'ایجاد آگهی' : 'ذخیره تغییرات'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function DeleteConfirmModal({
  ad,
  onClose,
  onConfirm,
  isDeleting,
}: {
  ad: Ad;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white text-center mb-2">
          حذف آگهی
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          آیا از حذف <b>«{ad.title}»</b> مطمئن هستید؟
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-medium"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            حذف کن
          </button>
        </div>
      </div>
    </div>
  );
}