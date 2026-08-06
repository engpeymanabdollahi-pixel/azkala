import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Package, Plus, Search, Edit, Trash2, Eye, MoreVertical, History,
  AlertCircle, CheckCircle, XCircle, X, Grid3x3, List,
  DollarSign, Loader2, Download, CheckSquare, Square,
  RefreshCw, Flame, ArrowUpDown, Copy, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';
import { useSellerProducts, useDeleteProduct } from '@/hooks/api/useSellerProducts';
import { ProductFormModal } from './ProductFormModal'; 
import { ProductHistoryModal } from './ProductHistoryModal';
import { useParams, useNavigate } from 'react-router-dom';

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive' | 'out_of_stock';
type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'stock_asc';

// ==================== Sub-Components (Optimized) ====================

const ProductSkeleton = () => (
  <div className="animate-pulse bg-white rounded-xl border border-gray-100 p-3">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, gradient }: { icon: React.ElementType; label: string; value: number; gradient: string }) => (
  <div className="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all group cursor-pointer hover:scale-[1.02]">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-xs text-gray-600 font-semibold">{label}</span>
    </div>
    <p className="text-lg font-black text-gray-900">{value.toLocaleString('fa-IR')}</p>
  </div>
);

const MenuItem = ({ icon: Icon, label, color, onClick }: { icon: React.ElementType; label: string; color: 'primary' | 'error' | 'gray'; onClick: () => void }) => {
  const colorClasses = { 
    primary: 'hover:bg-primary-50 text-gray-700 hover:text-primary-700', 
    error: 'hover:bg-error-50 text-error-600', 
    gray: 'hover:bg-gray-50 text-gray-700' 
  };
  const iconBgClasses = { 
    primary: 'bg-primary-100 text-primary-600', 
    error: 'bg-error-100 text-error-600', 
    gray: 'bg-gray-100 text-gray-600' 
  };
  
  return (
    <button onClick={onClick} className={`w-full text-right px-3 py-2 transition-colors flex items-center gap-2.5 text-xs font-medium ${colorClasses[color]}`}>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${iconBgClasses[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      {label}
    </button>
  );
};

// ==================== Main Component ====================

export function SellerProducts() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  
  const { data: productsData, isLoading, error, isRefetching } = useSellerProducts(1, 100);
  const deleteProductMutation = useDeleteProduct();

  const products = useMemo(() => productsData?.data || [], [productsData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  
  // ✅ State برای مودال تاریخچه
  const [historyProductId, setHistoryProductId] = useState<number | null>(null);
  
  const [formModalMode, setFormModalMode] = useState<'create' | 'edit'>('create');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showQuickView, setShowQuickView] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ محاسبه نام محصول برای نمایش در مودال تاریخچه
  const historyProductName = useMemo(() => {
    if (!historyProductId) return '';
    const product = products.find((p) => p.id === historyProductId);
    return product ? product.name : 'محصول نامشخص';
  }, [historyProductId, products]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (productId) {
      setFormModalMode('edit');
      setEditingProductId(Number(productId));
      setIsFormModalOpen(true);
    }
  }, [productId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); handleOpenCreateModal(); }
      else if (e.key === '/' ) { e.preventDefault(); searchInputRef.current?.focus(); }
      else if (e.key === 'Escape') {
        setIsFormModalOpen(false);
        setShowQuickView(null);
        setShowDeleteConfirm(null);
        setShowDropdown(null);
        setHistoryProductId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => {
        if (statusFilter === 'active') return p.is_active && p.stock > 0;
        if (statusFilter === 'inactive') return !p.is_active;
        if (statusFilter === 'out_of_stock') return p.stock === 0;
        return true;
      });
    }
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc': return parseFloat(a.price) - parseFloat(b.price);
        case 'price_desc': return parseFloat(b.price) - parseFloat(a.price);
        case 'name_asc': return a.name.localeCompare(b.name, 'fa');
        case 'name_desc': return b.name.localeCompare(a.name, 'fa');
        case 'stock_asc': return a.stock - b.stock;
        default: return 0;
      }
    });
    return filtered;
  }, [products, statusFilter, debouncedSearch, sortBy]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.is_active && p.stock > 0);
    const totalRevenue = active.reduce((sum, p) => sum + parseFloat(p.price) * Math.min(p.stock, 10), 0);
    return {
      total: products.length,
      active: active.length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      inactive: products.filter((p) => !p.is_active).length,
      totalRevenue,
      lowStock: products.filter((p) => p.stock > 0 && p.stock < 10).length,
    };
  }, [products]);

  const handleOpenCreateModal = useCallback(() => {
    setFormModalMode('create');
    setEditingProductId(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((id: number) => {
    setFormModalMode('edit');
    setEditingProductId(id);
    setIsFormModalOpen(true);
    setShowDropdown(null);
    setShowQuickView(null);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    const product = products.find((p) => p.id === id);
    try {
      await deleteProductMutation.mutateAsync(id);
      setShowDeleteConfirm(null);
      toast.success(`محصول "${product?.name.slice(0, 20)}..." با موفقیت حذف شد`, { icon: '🗑️' });
    } catch {
      toast.error('خطا در حذف محصول. لطفاً دوباره تلاش کنید.');
    }
  }, [deleteProductMutation, products]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedProducts);
    try {
      await Promise.all(ids.map((id) => deleteProductMutation.mutateAsync(id)));
      setSelectedProducts(new Set());
      setShowBulkDeleteConfirm(false);
      toast.success(`${ids.length} محصول با موفقیت حذف شدند`);
    } catch {
      toast.error('خطا در حذف دسته‌ای محصولات');
    }
  }, [deleteProductMutation, selectedProducts]);

  const toggleProductSelection = useCallback((id: number) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedProducts((prev) => 
      prev.size === filteredProducts.length && filteredProducts.length > 0 
        ? new Set() 
        : new Set(filteredProducts.map((p) => p.id))
    );
  }, [filteredProducts]);

  const handleExportCSV = useCallback(() => {
    const headers = ['نام', 'قیمت', 'موجودی', 'SKU', 'وضعیت'];
    const rows = filteredProducts.map((p) => [
      p.name, p.price, p.stock, p.sku || '-', p.is_active ? 'فعال' : 'غیرفعال'
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('فایل CSV با موفقیت دانلود شد');
  }, [filteredProducts]);

  const getStatusBadge = useCallback((product: Product) => {
    if (product.stock === 0) return <Badge variant="error" size="sm" className="gap-1"><AlertCircle className="w-3 h-3" />ناموجود</Badge>;
    if (!product.is_active) return <Badge variant="gray" size="sm" className="gap-1"><XCircle className="w-3 h-3" />غیرفعال</Badge>;
    if (product.stock < 10) return <Badge variant="warning" size="sm" className="gap-1"><Flame className="w-3 h-3" />کم‌موجود</Badge>;
    return <Badge variant="success" size="sm" className="gap-1"><CheckCircle className="w-3 h-3" />فعال</Badge>;
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 bg-gray-50/50 min-h-screen space-y-4">
        <div className="animate-pulse h-8 bg-gray-200 rounded w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-error-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">خطا در بارگذاری محصولات</h3>
          <p className="text-gray-500 text-sm mb-6">مشکلی در ارتباط با سرور رخ داده است.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="gap-2"><RefreshCw className="w-4 h-4" />تلاش مجدد</Button>
            <Button variant="outline" onClick={() => navigate('/seller')}>بازگشت به داشبورد</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50/50 min-h-screen pb-24">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-primary-600" />
            مدیریت محصولات
            {isRefetching && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
          </h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت موجودی، قیمت‌گذاری و وضعیت محصولات فروشگاه</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={products.length === 0} className="gap-2">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">خروجی CSV</span>
          </Button>
          <Button onClick={handleOpenCreateModal} className="gap-2 shadow-lg shadow-primary-500/20">
            <Plus className="w-4 h-4" />افزودن محصول جدید
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Package} label="کل محصولات" value={stats.total} gradient="from-primary-500 to-primary-600" />
        <StatCard icon={CheckCircle} label="فعال" value={stats.active} gradient="from-success-500 to-success-600" />
        <StatCard icon={AlertCircle} label="ناموجود" value={stats.outOfStock} gradient="from-error-500 to-error-600" />
        <StatCard icon={XCircle} label="غیرفعال" value={stats.inactive} gradient="from-gray-500 to-gray-600" />
        <div className="bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl p-3 text-white shadow-md col-span-2 md:col-span-1 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-white/90 font-semibold">ارزش تقریبی انبار</span>
          </div>
          <p className="text-lg font-black">{formatPrice(stats.totalRevenue)}</p>
          {stats.lowStock > 0 && (
            <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
              <Flame className="w-3 h-3" />{stats.lowStock} محصول کم‌موجود
            </p>
          )}
        </div>
      </div>

      {/* 3. Filters & Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="جستجو در نام، SKU یا توضیحات... (کلید /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white cursor-pointer text-sm min-w-[140px]"
            >
              <option value="newest">جدیدترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
              <option value="stock_asc">کم‌موجودی</option>
            </select>
            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'همه', icon: Package, count: stats.total },
            { id: 'active', label: 'فعال', icon: CheckCircle, count: stats.active },
            { id: 'out_of_stock', label: 'ناموجود', icon: AlertCircle, count: stats.outOfStock },
            { id: 'inactive', label: 'غیرفعال', icon: XCircle, count: stats.inactive },
          ].map((filter) => {
            const Icon = filter.icon;
            const isActive = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as StatusFilter)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                  isActive ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-600'}`}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Products Content */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-gray-300" />}
          title={debouncedSearch ? 'محصولی یافت نشد' : 'هنوز محصولی اضافه نکرده‌اید'}
          description={debouncedSearch ? `نتیجه‌ای برای "${debouncedSearch}" پیدا نشد. فیلترها را تغییر دهید.` : 'برای شروع فروش، اولین محصول خود را به فروشگاه اضافه کنید.'}
          action={!debouncedSearch && (
            <Button onClick={handleOpenCreateModal} className="gap-2 mt-4">
              <Plus className="w-4 h-4" />افزودن اولین محصول
            </Button>
          )}
        />
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 w-12">
                    <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-gray-200 transition-colors">
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">محصول</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">قیمت</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">موجودی</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">وضعیت</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  return (
                    <tr key={product.id} className={`transition-colors group ${isSelected ? 'bg-primary-50/40' : 'hover:bg-gray-50/80'}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleProductSelection(product.id)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                            {product.main_image ? (
                              <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : <span className="text-xl">📦</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-600 transition-colors">{product.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{product.sku || 'بدون SKU'}</span>
                              {product.category && <span className="text-[10px] text-gray-500">• {product.category.name}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black text-gray-900 text-sm">{formatPrice(parseFloat(product.price))}</p>
                        {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                          <p className="text-[10px] text-gray-400 line-through">{formatPrice(parseFloat(product.discount_price))}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${product.stock === 0 ? 'text-error-600' : product.stock < 10 ? 'text-warning-600' : 'text-gray-900'}`}>
                          {product.stock} عدد
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(product)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 relative" ref={showDropdown === product.id ? dropdownRef : undefined}>
                          <Button variant="ghost" size="xs" onClick={() => setShowQuickView(product)} className="text-gray-500 hover:text-primary-600" title="مشاهده سریع">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => handleOpenEditModal(product.id)} className="text-gray-500 hover:text-primary-600" title="ویرایش">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* ✅ دکمه تاریخچه تغییرات */}
                          <Button variant="ghost" size="xs" onClick={() => setHistoryProductId(product.id)} className="text-gray-500 hover:text-accent-600" title="تاریخچه تغییرات">
                            <History className="w-4 h-4" />
                          </Button>
                          
                          <div className="relative">
                            <Button variant="ghost" size="xs" onClick={() => setShowDropdown(showDropdown === product.id ? null : product.id)} className="text-gray-500 hover:text-gray-900">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {showDropdown === product.id && (
                              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <MenuItem icon={Eye} label="مشاهده سریع" color="primary" onClick={() => { setShowQuickView(product); setShowDropdown(null); }} />
                                <MenuItem icon={Edit} label="ویرایش محصول" color="primary" onClick={() => handleOpenEditModal(product.id)} />
                                <MenuItem icon={ExternalLink} label="مشاهده در سایت" color="primary" onClick={() => { navigate(`/products/${product.slug}`); setShowDropdown(null); }} />
                                <MenuItem icon={Copy} label="کپی اطلاعات" color="gray" onClick={() => { 
                                  navigator.clipboard.writeText(`${product.name}\nقیمت: ${product.price} تومان`); 
                                  toast.success('اطلاعات کپی شد'); 
                                  setShowDropdown(null); 
                                }} />
                                <div className="border-t border-gray-100 my-1" />
                                <MenuItem icon={Trash2} label="حذف محصول" color="error" onClick={() => { setShowDeleteConfirm(product.id); setShowDropdown(null); }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedProducts.has(product.id);
            return (
              <div key={product.id} className={`group bg-white rounded-xl border-2 transition-all overflow-hidden ${isSelected ? 'border-primary-500 shadow-md ring-2 ring-primary-500/20' : 'border-gray-100 hover:border-primary-200 hover:shadow-lg'}`}>
                <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.main_image ? (
                    <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : <span className="text-5xl">📦</span>}
                  
                  <button onClick={() => toggleProductSelection(product.id)} className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${isSelected ? 'bg-primary-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-600 opacity-0 group-hover:opacity-100'}`}>
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  
                  <div className="absolute top-3 left-3">{getStatusBadge(product)}</div>
                  
                  {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                    <div className="absolute bottom-3 right-3 bg-error-600 text-white px-2 py-1 rounded-md text-xs font-black shadow-md">
                      {Math.round(((parseFloat(product.price) - parseFloat(product.discount_price)) / parseFloat(product.price)) * 100)}٪ تخفیف
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button onClick={() => setShowQuickView(product)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-lg hover:scale-110"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenEditModal(product.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-lg hover:scale-110"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setHistoryProductId(product.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-accent-600 hover:text-white transition-all shadow-lg hover:scale-110" title="تاریخچه"><History className="w-4 h-4" /></button>
                    <button onClick={() => setShowDeleteConfirm(product.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-error-600 hover:text-white transition-all shadow-lg hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-black text-primary-700">{formatPrice(parseFloat(product.price))}</span>
                    {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(parseFloat(product.discount_price))}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`text-xs font-bold flex items-center gap-1 ${product.stock === 0 ? 'text-error-600' : product.stock < 10 ? 'text-warning-600' : 'text-gray-600'}`}>
                      <Package className="w-3.5 h-3.5" />{product.stock} عدد
                    </span>
                    {product.category && <Badge variant="gray" size="sm">{product.category.name}</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Unified Product Form Modal (Create & Edit) */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingProductId(null); }}
        mode={formModalMode}
        productId={editingProductId}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setEditingProductId(null);
        }}
      />

      {/* 6. Product History Modal (✅ اصلاح شده و در جای صحیح قرار گرفت) */}
      <ProductHistoryModal 
        isOpen={!!historyProductId} 
        onClose={() => setHistoryProductId(null)} 
        productId={historyProductId || 0}
        productName={historyProductName}
      />

      {/* 7. Quick View Modal */}
      {showQuickView && (
        <Modal isOpen={!!showQuickView} onClose={() => setShowQuickView(null)} size="lg" title="مشاهده سریع محصول">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
              {showQuickView.main_image ? (
                <img src={showQuickView.main_image} alt={showQuickView.name} className="w-full h-full object-cover" />
              ) : <span className="text-8xl">📦</span>}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{showQuickView.name}</h3>
                {showQuickView.sku && <p className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-2 py-1 rounded">SKU: {showQuickView.sku}</p>}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-primary-700">{formatPrice(parseFloat(showQuickView.price))}</span>
                {showQuickView.discount_price && parseFloat(showQuickView.discount_price) < parseFloat(showQuickView.price) && (
                  <span className="text-sm text-gray-400 line-through">{formatPrice(parseFloat(showQuickView.discount_price))}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 border ${showQuickView.stock === 0 ? 'bg-error-50 text-error-700 border-error-200' : showQuickView.stock < 10 ? 'bg-warning-50 text-warning-700 border-warning-200' : 'bg-success-50 text-success-700 border-success-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1"><Package className="w-4 h-4" /><span className="text-xs font-semibold">موجودی</span></div>
                  <p className="text-lg font-black">{showQuickView.stock} عدد</p>
                </div>
                <div className="rounded-lg p-3 border bg-gray-50 text-gray-700 border-gray-200">
                  <div className="flex items-center gap-1.5 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-xs font-semibold">وضعیت</span></div>
                  <p className="text-lg font-black">{showQuickView.is_active ? 'فعال' : 'غیرفعال'}</p>
                </div>
              </div>
              {showQuickView.description && (
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">توضیحات</h4>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{showQuickView.description}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button onClick={() => handleOpenEditModal(showQuickView.id)} className="flex-1 gap-2">
                  <Edit className="w-4 h-4" />ویرایش محصول
                </Button>
                <Button variant="outline" onClick={() => { navigate(`/products/${showQuickView.slug}`); setShowQuickView(null); }} className="gap-2">
                  <ExternalLink className="w-4 h-4" />مشاهده در سایت
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm !== null} onClose={() => setShowDeleteConfirm(null)} size="sm" title="حذف محصول">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-error-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">آیا از حذف این محصول مطمئن هستید؟</h3>
          <p className="text-gray-500 text-sm mb-6">این عمل غیرقابل بازگشت است و تمام اطلاعات محصول از سیستم حذف خواهد شد.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(null)}>انصراف</Button>
            <Button variant="danger" className="flex-1 gap-2" onClick={() => handleDelete(showDeleteConfirm!)} disabled={deleteProductMutation.isPending}>
              {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف دائمی
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Bulk Delete Confirmation */}
      <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} size="sm" title="حذف دسته‌ای">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-error-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">حذف {selectedProducts.size} محصول؟</h3>
          <p className="text-gray-500 text-sm mb-6">این عمل غیرقابل بازگشت است. آیا مطمئن هستید؟</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowBulkDeleteConfirm(false)}>انصراف</Button>
            <Button variant="danger" className="flex-1 gap-2" onClick={handleBulkDelete} disabled={deleteProductMutation.isPending}>
              {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف همه
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. Sticky Bulk Action Bar */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="font-bold text-sm">{selectedProducts.size} محصول انتخاب شده</p>
                <button onClick={() => setSelectedProducts(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">لغو انتخاب</button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setSelectedProducts(new Set())}>
                انصراف
              </Button>
              <Button variant="danger" className="gap-2" onClick={() => setShowBulkDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4" />حذف انتخاب‌شده‌ها
              </Button>
            </div>
          </div >
        </div>
      )}
    </div>
  );
}

export default SellerProducts;