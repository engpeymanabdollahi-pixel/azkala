import { useState, useEffect } from 'react';
import {
  Bot, Search, Filter, Loader2, X, Plus, Edit2, Trash2,
  ToggleLeft, ToggleRight, TrendingUp, AlertCircle,
  ChevronLeft, ChevronRight, Tag, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface Faq {
  id: number;
  seller_id: number | null;
  question_pattern: string;
  answer: string;
  category: 'general' | 'shipping' | 'payment' | 'product' | 'returns';
  priority: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  seller?: {
    id: number;
    name: string;
    shop_name: string | null;
  };
}

interface FaqStats {
  total: number;
  active: number;
  inactive: number;
  system: number;
  seller: number;
  total_usage: number;
  most_used: Array<{
    id: number;
    question_pattern: string;
    answer: string;
    usage_count: number;
    seller_name: string;
    category: string;
  }>;
  unused: Array<{
    id: number;
    question_pattern: string;
    seller_name: string;
    created_at: string;
  }>;
  by_category: Array<{
    category: string;
    count: number;
    total_usage: number;
  }>;
}

// ==================== Main Component ====================

export function AdminFaqManagementPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [stats, setStats] = useState<FaqStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState({
    question_pattern: '',
    answer: '',
    category: 'general' as const,
    priority: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  // ==================== Loaders ====================
  const loadFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/faq-management', {
        params: {
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          search: searchQuery || undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setFaqs(res.data.data.faqs);
        setTotalPages(res.data.data.pagination.last_page);
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری FAQ ها');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/admin/faq-management/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadFaqs();
    loadStats();
  }, [currentPage, categoryFilter, statusFilter, typeFilter]);

  // ==================== Handlers ====================
  const handleSearch = () => {
    setCurrentPage(1);
    loadFaqs();
  };

  const handleCreate = () => {
    setEditingFaq(null);
    setFormData({
      question_pattern: '',
      answer: '',
      category: 'general',
      priority: 0,
    });
    setShowFormModal(true);
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question_pattern: faq.question_pattern,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority,
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!formData.question_pattern.trim() || !formData.answer.trim()) {
      toast.error('لطفاً الگو و پاسخ را وارد کنید');
      return;
    }

    setIsSaving(true);
    try {
      if (editingFaq) {
        const res = await apiClient.put(`/admin/faq-management/${editingFaq.id}`, formData);
        if (res.data.success) {
          toast.success('FAQ بروزرسانی شد');
          setShowFormModal(false);
          loadFaqs();
          loadStats();
        }
      } else {
        const res = await apiClient.post('/admin/faq-management/system', formData);
        if (res.data.success) {
          toast.success('FAQ سیستمی ساخته شد');
          setShowFormModal(false);
          loadFaqs();
          loadStats();
        }
      }
    } catch (error) {
      toast.error('خطا در ذخیره');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این FAQ را حذف کنید؟')) return;

    try {
      const res = await apiClient.delete(`/admin/faq-management/${id}`);
      if (res.data.success) {
        toast.success('FAQ حذف شد');
        loadFaqs();
        loadStats();
      }
    } catch (error) {
      toast.error('خطا در حذف');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await apiClient.post(`/admin/faq-management/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadFaqs();
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'عمومی',
      shipping: 'ارسال',
      payment: 'پرداخت',
      product: 'محصول',
      returns: 'مرجوعی',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700',
      shipping: 'bg-blue-100 text-blue-700',
      payment: 'bg-green-100 text-green-700',
      product: 'bg-purple-100 text-purple-700',
      returns: 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">مدیریت FAQ سراسری</h1>
            <p className="text-sm text-gray-500 mt-1">کنترل پاسخ‌های خودکار همه فروشندگان</p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-1.5 bg-accent-500 hover:bg-accent-600 text-white"
        >
          <Plus className="w-4 h-4" />
          FAQ سیستمی جدید
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">کل FAQ ها</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <ToggleRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-green-600">{stats.active.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">فعال</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <ToggleLeft className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-600">{stats.inactive.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">غیرفعال</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-primary-600">{stats.system.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">سیستمی</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-warning-600">{stats.total_usage.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">کل استفاده</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-error-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-error-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-error-600">{stats.unused.length}</p>
            <p className="text-xs text-gray-500 mt-1">بدون استفاده</p>
          </div>
        </div>
      )}

      {/* Top Lists */}
      {stats && (stats.most_used.length > 0 || stats.unused.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Most Used */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success-600" />
              پراستفاده‌ترین FAQ ها
            </h3>
            <div className="space-y-2">
              {stats.most_used.slice(0, 5).map((faq, i) => (
                <div key={faq.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 bg-success-100 text-success-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{faq.question_pattern}</p>
                      <p className="text-[10px] text-gray-500">{faq.seller_name}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{faq.usage_count}x</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Unused */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-error-600" />
              FAQ های بدون استفاده
            </h3>
            <div className="space-y-2">
              {stats.unused.slice(0, 5).map((faq, i) => (
                <div key={faq.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 bg-error-100 text-error-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{faq.question_pattern}</p>
                      <p className="text-[10px] text-gray-500">{faq.seller_name} - {faq.created_at}</p>
                    </div>
                  </div>
                  <Badge variant="error" size="sm">0x</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در الگو یا پاسخ..."
              className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            <option value="general">عمومی</option>
            <option value="shipping">ارسال</option>
            <option value="payment">پرداخت</option>
            <option value="product">محصول</option>
            <option value="returns">مرجوعی</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4" />
            اعمال فیلتر
          </Button>
        </div>
      </div>

      {/* FAQ List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bot className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-bold">FAQ ای یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.id} className={cn(
                'p-4 hover:bg-gray-50 transition-colors',
                !faq.is_active && 'opacity-60'
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={faq.is_active ? 'success' : 'gray'} size="sm">
                        {faq.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-xs font-bold',
                        getCategoryColor(faq.category)
                      )}>
                        {getCategoryLabel(faq.category)}
                      </span>
                      {!faq.seller_id && (
                        <Badge variant="primary" size="sm">
                          <Shield className="w-3 h-3" />
                          سیستمی
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {faq.usage_count} استفاده
                      </span>
                      <span className="text-xs text-gray-500">
                        اولویت: {faq.priority}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">الگوی سوال:</p>
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800" dir="ltr">
                        /{faq.question_pattern}/
                      </p>
                    </div>

                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">پاسخ:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {faq.answer}
                      </p>
                    </div>

                    {faq.seller && (
                      <p className="text-xs text-gray-500">
                        فروشنده: <span className="font-bold">{faq.seller.name}</span>
                        {faq.seller.shop_name && ` (${faq.seller.shop_name})`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(faq.id)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        faq.is_active 
                          ? 'text-success-600 hover:bg-success-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      )}
                      title={faq.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      {faq.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(faq)}
                      className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg"
                      title="ویرایش"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="text-error-600 hover:bg-error-50 p-1.5 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
            <span className="text-sm text-gray-600">
              صفحه {currentPage} از {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-accent-500 to-accent-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <h2 className="font-black text-lg">
                  {editingFaq ? 'ویرایش FAQ' : 'FAQ سیستمی جدید'}
                </h2>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  الگوی سوال (Regex)
                  <span className="text-gray-500 font-normal mr-1">- کلمات با | جدا شوند</span>
                </label>
                <input
                  type="text"
                  value={formData.question_pattern}
                  onChange={(e) => setFormData({ ...formData, question_pattern: e.target.value })}
                  placeholder="مثال: قیمت|چند|هزینه"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">پاسخ خودکار</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="پاسخ ربات..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">دسته‌بندی</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="general">عمومی</option>
                    <option value="shipping">ارسال</option>
                    <option value="payment">پرداخت</option>
                    <option value="product">محصول</option>
                    <option value="returns">مرجوعی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اولویت (0-100)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFormModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingFaq ? 'بروزرسانی' : 'ذخیره'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function Shield(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
export default AdminFaqManagementPage;
