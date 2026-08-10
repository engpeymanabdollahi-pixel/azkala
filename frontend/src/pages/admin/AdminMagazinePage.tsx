import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Newspaper, Search, RefreshCw, Plus, Edit2, Trash2,
  Eye, EyeOff, CheckCircle, ExternalLink, Loader2,
  BarChart3, TrendingUp, Clock, FileText, AlertCircle, X, Sparkles
} from 'lucide-react';
import AiArticleModal from '@/components/magazine/AiArticleModal';
import { adminMagazineService } from '@/services/api/adminMagazine.service';
import type {
  AdminMagazineArticle,
  AdminMagazineListParams,
  AdminArticleFormData,
} from '@/services/api/adminMagazine.service';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

// ==================== Constants ====================

const CATEGORIES = [
  { key: 'all', label: 'همه دسته‌ها', icon: '📋' },
  { key: 'news', label: 'اخبار', icon: '📰' },
  { key: 'review', label: 'بررسی', icon: '🔍' },
  { key: 'comparison', label: 'مقایسه', icon: '⚖️' },
  { key: 'guide', label: 'راهنما', icon: '📚' },
  { key: 'rumor', label: 'شایعات', icon: '🔮' },
];

const SOURCES = [
  { key: 'all', label: 'همه منابع' },
  { key: 'admin', label: 'توسط ادمین' },
  { key: 'rss', label: 'RSS (خودکار)' },
  { key: 'ai_generated', label: 'تولید AI' },
];

const PUBLISH_FILTER = [
  { key: 'all', label: 'همه' },
  { key: 'published', label: 'منتشر شده' },
  { key: 'draft', label: 'پیش‌نویس' },
];

const DEVICES_FILTER = [
  { key: 'all', label: 'همه' },
  { key: 'yes', label: 'با دستگاه' },
  { key: 'no', label: 'بدون دستگاه' },
];

const CATEGORY_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  review: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  comparison: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  guide: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  rumor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

// ==================== Empty Form ====================

const emptyForm: AdminArticleFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image: '',
  category: 'news',
  content_source: 'admin',
  source_name: 'ازکالا',
  source_url: '',
  is_published: true,
  device_ids: [],
};

// ==================== Component ====================

export default function AdminMagazinePage() {
  const queryClient = useQueryClient();

  // ----- Filters State -----
  const [filters, setFilters] = useState<AdminMagazineListParams>({
    page: 1,
    per_page: 20,
    category: undefined,
    content_source: undefined,
    is_published: undefined,
    has_devices: undefined,
    search: '',
    sort_by: 'published_at',
    sort_dir: 'desc',
  });

  const [searchInput, setSearchInput] = useState('');

  // ----- Selection State -----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ----- Modal State -----
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showAiModal, setShowAiModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<AdminMagazineArticle | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<AdminMagazineArticle | null>(null);
  const [formData, setFormData] = useState<AdminArticleFormData>(emptyForm);

  // ==================== Queries ====================

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-magazine-stats'],
    queryFn: () => adminMagazineService.getStats(),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-magazine-list', filters],
    queryFn: () => adminMagazineService.getArticles(filters),
  });

  const articles = data?.data ?? [];
  const meta = data?.meta;
  const stats = statsData?.data;

  // ==================== Mutations ====================

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminMagazineService.toggleArticle(id),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-stats'] });
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminMagazineService.deleteArticle(id),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-stats'] });
      setShowDeleteModal(false);
      setDeletingArticle(null);
    },
    onError: () => toast.error('خطا در حذف'),
  });

  const bulkMutation = useMutation({
    mutationFn: adminMagazineService.bulkAction,
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-stats'] });
    },
    onError: () => toast.error('خطا در عملیات گروهی'),
  });

  const createMutation = useMutation({
    mutationFn: (data: AdminArticleFormData) => adminMagazineService.createArticle(data),
    onSuccess: (data) => {
      toast.success('مقاله ایجاد شد');
      setShowCreateModal(false);
      setFormData(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-stats'] });
    },
    onError: () => toast.error('خطا در ایجاد مقاله'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminArticleFormData> }) =>
      adminMagazineService.updateArticle(id, data),
    onSuccess: () => {
      toast.success('مقاله ویرایش شد');
      setShowEditModal(false);
      setEditingArticle(null);
      setFormData(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-magazine-list'] });
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
      per_page: 20,
      sort_by: 'published_at',
      sort_dir: 'desc',
    });
    setSearchInput('');
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = articles.map((a) => a.id);
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [articles, selectedIds]);

  const handleSelectOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openEdit = useCallback((article: AdminMagazineArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content || '',
      featured_image: article.featured_image || '',
      category: article.category?.key || 'news',
      content_source: article.content_source?.key || 'rss',
      source_name: article.source?.name || 'ازکالا',
      source_url: article.source?.url || '',
      is_published: article.is_published,
      device_ids: article.devices?.map((d) => d.id) || [],
    });
    setShowEditModal(true);
  }, []);

  const openDelete = useCallback((article: AdminMagazineArticle) => {
    setDeletingArticle(article);
    setShowDeleteModal(true);
  }, []);

  const openCreate = useCallback(() => {
    setFormData(emptyForm);
    setShowCreateModal(true);
  }, []);

  const handleSubmitForm = useCallback(() => {
    if (!formData.title.trim()) {
      toast.error('عنوان الزامی است');
      return;
    }
    if (showEditModal && editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }, [formData, showEditModal, editingArticle, updateMutation, createMutation]);

  // ==================== Derived ====================

  const hasActiveFilters = useMemo(
    () => filters.category || filters.content_source || filters.is_published !== undefined || filters.has_devices || filters.search,
    [filters]
  );

  const isAllSelected = articles.length > 0 && selectedIds.size === articles.length;

  // ==================== Render ====================

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            مدیریت مجله
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت مقالات، اخبار و محتوای مجله ازکالا
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            تازه‌سازی
          </button>
          <button
  onClick={() => setShowAiModal(true)}
  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20"
>
  <Sparkles className="w-4 h-4" />
  تولید با AI
</button>
<button
  onClick={openCreate}
  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20"
>
  <Plus className="w-4 h-4" />
  مقاله جدید
</button>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard
          icon={FileText}
          label="کل مقالات"
          value={stats?.total_articles ?? 0}
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle}
          label="منتشر شده"
          value={stats?.published ?? 0}
          color="green"
          loading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label="پیش‌نویس"
          value={stats?.draft ?? 0}
          color="yellow"
          loading={statsLoading}
        />
        <StatCard
          icon={Eye}
          label="کل بازدید"
          value={stats?.total_views ?? 0}
          color="purple"
          loading={statsLoading}
        />
        <StatCard
          icon={BarChart3}
          label="با دستگاه"
          value={stats?.with_devices ?? 0}
          color="pink"
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="امروز"
          value={stats?.today_count ?? 0}
          color="orange"
          loading={statsLoading}
        />
      </div>

      {/* ===== Filters ===== */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در عنوان، خلاصه و محتوا..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            جستجو
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors"
            >
              حذف فیلترها
            </button>
          )}
        </div>

        {/* Selects row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <FilterSelect
            value={filters.category ?? 'all'}
            onChange={(v) => setFilters((f) => ({ ...f, category: v === 'all' ? undefined : v, page: 1 }))}
            options={CATEGORIES}
          />
          <FilterSelect
            value={filters.content_source ?? 'all'}
            onChange={(v) => setFilters((f) => ({ ...f, content_source: v === 'all' ? undefined : v, page: 1 }))}
            options={SOURCES}
          />
          <FilterSelect
            value={
              filters.is_published === true ? 'published' : filters.is_published === false ? 'draft' : 'all'
            }
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                is_published: v === 'published' ? true : v === 'draft' ? false : undefined,
                page: 1,
              }))
            }
            options={PUBLISH_FILTER}
          />
          <FilterSelect
            value={filters.has_devices ?? 'all'}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                has_devices: v === 'all' ? undefined : (v as 'yes' | 'no'),
                page: 1,
              }))
            }
            options={DEVICES_FILTER}
          />
        </div>
      </div>

      {/* ===== Bulk Actions ===== */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-bold text-primary-900 dark:text-primary-200">
            {selectedIds.size} مقاله انتخاب شده
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkMutation.mutate({ action: 'publish', ids: Array.from(selectedIds) })}
              disabled={bulkMutation.isPending}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              انتشار گروهی
            </button>
            <button
              onClick={() => bulkMutation.mutate({ action: 'unpublish', ids: Array.from(selectedIds) })}
              disabled={bulkMutation.isPending}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              لغو انتشار
            </button>
            <button
              onClick={() => {
                if (confirm(`حذف ${selectedIds.size} مقاله؟`)) {
                  bulkMutation.mutate({ action: 'delete', ids: Array.from(selectedIds) });
                }
              }}
              disabled={bulkMutation.isPending}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              حذف گروهی
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs font-medium rounded-lg"
            >
              لغو انتخاب
            </button>
          </div>
        </div>
      )}

      {/* ===== Table ===== */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
          <div className="col-span-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded"
            />
            <span>#</span>
          </div>
          <div className="col-span-4">عنوان</div>
          <div className="col-span-2">دسته / منبع</div>
          <div className="col-span-1 text-center">دستگاه</div>
          <div className="col-span-1 text-center">بازدید</div>
          <div className="col-span-1 text-center">وضعیت</div>
          <div className="col-span-2 text-center">عملیات</div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16 text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            خطا در بارگذاری مقالات
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && articles.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            مقاله‌ای یافت نشد
          </div>
        )}

        {/* Rows */}
        {!isLoading && !error && articles.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isSelected={selectedIds.has(article.id)}
                onSelect={() => handleSelectOne(article.id)}
                onToggle={() => toggleMutation.mutate(article.id)}
                onEdit={() => openEdit(article)}
                onDelete={() => openDelete(article)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              صفحه {meta.current_page} از {meta.last_page} ({meta.total} مقاله)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                disabled={meta.current_page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-slate-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                قبلی
              </button>
              {Array.from({ length: Math.min(5, meta.last_page) }).map((_, i) => {
                let page: number;
                if (meta.last_page <= 5) page = i + 1;
                else if ((meta.current_page || 1) <= 3) page = i + 1;
                else if ((meta.current_page || 1) >= meta.last_page - 2) page = meta.last_page - 4 + i;
                else page = (meta.current_page || 1) - 2 + i;

                return (
                  <button
                    key={page}
                    onClick={() => setFilters((f) => ({ ...f, page }))}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium',
                      page === meta.current_page
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(meta.last_page, (f.page || 1) + 1) }))}
                disabled={meta.current_page === meta.last_page}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-slate-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Modals ===== */}
      {(showCreateModal || showEditModal) && (
        <ArticleFormModal
          mode={showEditModal ? 'edit' : 'create'}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setFormData(emptyForm);
          }}
          onSubmit={handleSubmitForm}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {showDeleteModal && deletingArticle && (
        <DeleteConfirmModal
          article={deletingArticle}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingArticle(null);
          }}
          onConfirm={() => deleteMutation.mutate(deletingArticle.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* ===== AI Article Modal ===== */}
      {showAiModal && (
        <AiArticleModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          onGenerate={(data) => {
            setFormData({
              title: data.title,
              slug: '',
              excerpt: data.excerpt,
              content: data.content,
              featured_image: '',
              category: (data.suggested_category as any) || 'news',
              content_source: 'ai_generated',
              source_name: 'هوش مصنوعی ازکالا',
              source_url: '',
              is_published: false,
              device_ids: [],
            });
            setShowAiModal(false);
            setShowCreateModal(true);
          }}
        />
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  loading?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', colorMap[color])}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
          <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
            {loading ? '—' : value.toLocaleString('fa-IR')}
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string; icon?: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {options.map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.icon ? `${opt.icon} ${opt.label}` : opt.label}
        </option>
      ))}
    </select>
  );
}

function ArticleRow({
  article,
  isSelected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
}: {
  article: AdminMagazineArticle;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const catColor = CATEGORY_COLORS[article.category.key] || 'bg-gray-100 text-gray-700';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
      {/* Checkbox + ID */}
      <div className="lg:col-span-1 flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 rounded"
        />
        <span className="text-xs text-gray-400 font-mono">#{article.id}</span>
      </div>

      {/* Title */}
      <div className="lg:col-span-4 flex items-start gap-3">
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
            {article.title}
          </h3>
          {article.source?.name && (
  <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
    {article.source.is_external && <ExternalLink className="w-3 h-3" />}
    {article.source.name} • {article.published_at_human}
  </span>
)}
        </div>
      </div>

      {/* Category + Source */}
      <div className="lg:col-span-2 flex items-start gap-2 flex-wrap">
        <span className={cn('px-2 py-1 rounded-lg text-xs font-bold', catColor)}>
          {typeof article.category === 'object' 
            ? article.category?.label 
            : article.category}
        </span>
        {article.content_source?.label && (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            {article.content_source.label}
          </span>
        )}
      </div>

      {/* Devices count */}
      <div className="lg:col-span-1 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {article.stats.devices_count || 0}
        </span>
      </div>

      {/* Views */}
      <div className="lg:col-span-1 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {article.stats.view_count.toLocaleString('fa-IR')}
        </span>
      </div>

      {/* Status */}
      <div className="lg:col-span-1 flex items-center justify-center">
        <button
          onClick={onToggle}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors',
            article.is_published
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200'
          )}
        >
          {article.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {article.is_published ? 'منتشر' : 'پیش‌نویس'}
        </button>
      </div>

      {/* Actions */}
      <div className="lg:col-span-2 flex items-center justify-center gap-2">
        <a
          href={`/magazine/${article.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="مشاهده"
        >
          <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </a>
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

function ArticleFormModal({
  mode,
  formData,
  setFormData,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  mode: 'create' | 'edit';
  formData: AdminArticleFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdminArticleFormData>>;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            {mode === 'create' ? 'مقاله جدید' : 'ویرایش مقاله'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
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

          <FormField label="نامک (Slug)">
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value }))}
              placeholder="خالی = ساخت خودکار"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="دسته‌بندی">
              <select
                value={formData.category}
                onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value as any }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="منبع محتوا">
              <select
                value={formData.content_source}
                onChange={(e) => setFormData((f) => ({ ...f, content_source: e.target.value as any }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SOURCES.filter((c) => c.key !== 'all').map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="خلاصه">
            <textarea
              value={formData.excerpt || ''}
              onChange={(e) => setFormData((f) => ({ ...f, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </FormField>

          <FormField label="محتوا (HTML)">
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </FormField>

          <FormField label="آدرس تصویر شاخص">
            <input
              type="url"
              value={formData.featured_image || ''}
              onChange={(e) => setFormData((f) => ({ ...f, featured_image: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="نام منبع">
              <input
                type="text"
                value={formData.source_name || ''}
                onChange={(e) => setFormData((f) => ({ ...f, source_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
            <FormField label="آدرس منبع">
              <input
                type="url"
                value={formData.source_url || ''}
                onChange={(e) => setFormData((f) => ({ ...f, source_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published ?? true}
              onChange={(e) => setFormData((f) => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              بلافاصله منتشر شود
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl text-sm font-medium"
          >
            انصراف
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'ایجاد مقاله' : 'ذخیره تغییرات'}
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
  article,
  onClose,
  onConfirm,
  isDeleting,
}: {
  article: AdminMagazineArticle;
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
          حذف مقاله
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          آیا از حذف <b>«{article.title}»</b> مطمئن هستید؟ این عملیات برگشت‌ناپذیر است.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 rounded-xl text-sm font-medium"
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