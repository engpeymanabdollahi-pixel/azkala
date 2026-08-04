import { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Loader2, X, Plus, Edit2, Trash2,
  ToggleLeft, ToggleRight, Package, Truck, CreditCard, 
  RotateCcw, MessageCircle, Sparkles, Tag, Zap,
  ChevronLeft, ChevronRight, Download, Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface MessageTemplate {
  id: number;
  title: string;
  content: string;
  category: string;
  icon: string | null;
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  priority: number;
  variables: string[] | null;
  created_at: string;
}

interface TemplateStats {
  total: number;
  active: number;
  inactive: number;
  system: number;
  total_usage: number;
}

// ==================== Main Component ====================

export function AdminMessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    icon: '',
    priority: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  // ==================== Loaders ====================
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/chat-management/message-templates', {
        params: {
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setTemplates(res.data.data.templates);
        setTotalPages(res.data.data.pagination.last_page);
        setStats(res.data.data.stats);
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری قالب‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [currentPage, categoryFilter, statusFilter]);

  // ==================== Handlers ====================
  const handleSearch = () => {
    setCurrentPage(1);
    loadTemplates();
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      icon: '',
      priority: 0,
    });
    setShowFormModal(true);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      icon: template.icon || '',
      priority: template.priority,
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('لطفاً عنوان و محتوا را وارد کنید');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        const res = await apiClient.put(`/admin/chat-management/message-templates/${editingTemplate.id}`, formData);
        if (res.data.success) {
          toast.success('قالب بروزرسانی شد');
          setShowFormModal(false);
          loadTemplates();
        }
      } else {
        const res = await apiClient.post('/admin/chat-management/message-templates', formData);
        if (res.data.success) {
          toast.success('قالب ساخته شد');
          setShowFormModal(false);
          loadTemplates();
        }
      }
    } catch (error) {
      toast.error('خطا در ذخیره');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این قالب را حذف کنید؟')) return;

    try {
      const res = await apiClient.delete(`/admin/chat-management/message-templates/${id}`);
      if (res.data.success) {
        toast.success('قالب حذف شد');
        loadTemplates();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در حذف');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await apiClient.post(`/admin/chat-management/message-templates/${id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadTemplates();
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('آیا می‌خواهید قالب‌های پیش‌فرض را ایجاد کنید؟')) return;

    try {
      const res = await apiClient.post('/admin/chat-management/message-templates/seed-defaults');
      if (res.data.success) {
        toast.success('قالب‌های پیش‌فرض ایجاد شدند');
        loadTemplates();
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
      greeting: 'خوش‌آمدگویی',
      farewell: 'خداحافظی',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      general: MessageCircle,
      shipping: Truck,
      payment: CreditCard,
      product: Package,
      returns: RotateCcw,
      greeting: Sparkles,
      farewell: MessageCircle,
    };
    return icons[category] || MessageCircle;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700',
      shipping: 'bg-blue-100 text-blue-700',
      payment: 'bg-green-100 text-green-700',
      product: 'bg-purple-100 text-purple-700',
      returns: 'bg-orange-100 text-orange-700',
      greeting: 'bg-pink-100 text-pink-700',
      farewell: 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">قالب‌های پیام حرفه‌ای</h1>
            <p className="text-sm text-gray-500 mt-1">مدیریت پاسخ‌های آماده و حرفه‌ای</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            قالب‌های پیش‌فرض
          </Button>
          <Button
            onClick={handleCreate}
            className="gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Plus className="w-4 h-4" />
            قالب جدید
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">کل قالب‌ها</p>
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
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-600">{stats.system.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">سیستمی</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-warning-600">{stats.total_usage.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">کل استفاده</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در عنوان یا محتوا..."
              className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            <option value="general">عمومی</option>
            <option value="shipping">ارسال</option>
            <option value="payment">پرداخت</option>
            <option value="product">محصول</option>
            <option value="returns">مرجوعی</option>
            <option value="greeting">خوش‌آمدگویی</option>
            <option value="farewell">خداحافظی</option>
          </select>
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4" />
            اعمال فیلتر
          </Button>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-bold">قالبی یافت نشد</p>
            <Button
              onClick={handleSeedDefaults}
              variant="outline"
              className="mt-4 gap-1.5"
            >
              <Download className="w-4 h-4" />
              ایجاد قالب‌های پیش‌فرض
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => {
              const CategoryIcon = getCategoryIcon(template.category);
              return (
                <div 
                  key={template.id} 
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors',
                    !template.is_active && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {template.icon && (
                          <span className="text-xl">{template.icon}</span>
                        )}
                        <h3 className="text-sm font-black text-gray-900">{template.title}</h3>
                        <Badge variant={template.is_active ? 'success' : 'gray'} size="sm">
                          {template.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                        {template.is_system && (
                          <Badge variant="primary" size="sm">
                            <Sparkles className="w-3 h-3" />
                            سیستمی
                          </Badge>
                        )}
                        <span className={cn(
                          'px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1',
                          getCategoryColor(template.category)
                        )}>
                          <CategoryIcon className="w-3 h-3" />
                          {getCategoryLabel(template.category)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {template.usage_count} استفاده
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {template.content}
                      </div>

                      {template.variables && template.variables.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <Tag className="w-3 h-3 text-gray-400" />
                          {template.variables.map((v, i) => (
                            <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                              {`{${v}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(template.id)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          template.is_active 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        )}
                        title={template.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                      >
                        {template.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg"
                        title="ویرایش"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!template.is_system && (
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
            <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <h2 className="font-black text-lg">
                  {editingTemplate ? 'ویرایش قالب' : 'قالب جدید'}
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
                <label className="block text-sm font-bold text-gray-700 mb-1">عنوان</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: خوش‌آمدگویی"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  محتوا
                  <span className="text-gray-500 font-normal mr-1">- از {'{متغیر}'} استفاده کنید</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="سلام {buyer_name} عزیز!..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">دسته‌بندی</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="general">عمومی</option>
                    <option value="shipping">ارسال</option>
                    <option value="payment">پرداخت</option>
                    <option value="product">محصول</option>
                    <option value="returns">مرجوعی</option>
                    <option value="greeting">خوش‌آمدگویی</option>
                    <option value="farewell">خداحافظی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">آیکون (Emoji)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="👋"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
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

              {/* متغیرهای پیشنهادی */}
              <div className="bg-indigo-50 rounded-lg p-3">
                <p className="text-xs font-bold text-indigo-700 mb-2">متغیرهای پیشنهادی:</p>
                <div className="flex flex-wrap gap-1">
                  {['buyer_name', 'seller_name', 'product_name', 'price', 'order_number', 'tracking_code', 'discount_code'].map(v => (
                    <button
                      key={v}
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = formData.content;
                          const newText = text.substring(0, start) + `{${v}}` + text.substring(end);
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="text-[10px] bg-white text-indigo-700 px-2 py-1 rounded font-mono hover:bg-indigo-100"
                    >
                      {`{${v}}`}
                    </button>
                  ))}
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
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingTemplate ? 'بروزرسانی' : 'ذخیره'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminMessageTemplatesPage;
