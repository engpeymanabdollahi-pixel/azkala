import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, Search, Edit, Trash2, Eye, MoreVertical,
  AlertCircle, CheckCircle, XCircle, X, Grid3x3, List,
  DollarSign, Loader2, Download, CheckSquare, Square,
  RefreshCw, Flame, ArrowUpDown, Copy, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';
import { useSellerProducts, useDeleteProduct } from '@/hooks/api/useSellerProducts';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive' | 'out_of_stock';
type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'stock_asc';

const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  </div>
);

export function SellerProducts() {
  const navigate = useNavigate();
  const { data: productsData, isLoading, error, refetch, isRefetching } = useSellerProducts(1, 100);
  const deleteProductMutation = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState<Product | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const products = useMemo(() => productsData?.data || [], [productsData]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((product) => {
        if (statusFilter === 'active') return product.is_active && product.stock > 0;
        if (statusFilter === 'inactive') return !product.is_active;
        if (statusFilter === 'out_of_stock') return product.stock === 0;
        return true;
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
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
  }, [products, statusFilter, searchQuery, sortBy]);

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

  const handleOpenEditModal = useCallback((productId: number) => {
    setEditingProductId(productId);
    setShowEditModal(true);
    setShowDropdown(null);
    setShowQuickView(null);
  }, []);

  const handleDelete = useCallback(async (productId: number) => {
    try {
      const product = products.find((p) => p.id === productId);
      await deleteProductMutation.mutateAsync(productId);
      setShowDeleteConfirm(null);
      toast.success(
        <span className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success-500" />
          محصول "{product?.name.slice(0, 20)}" حذف شد
        </span>,
        { duration: 3000 }
      );
    } catch {
      toast.error('خطا در حذف محصول');
    }
  }, [deleteProductMutation, products]);

  const handleBulkDelete = useCallback(async () => {
    try {
      const ids = Array.from(selectedProducts);
      await Promise.all(ids.map((id) => deleteProductMutation.mutateAsync(id)));
      setSelectedProducts(new Set());
      setShowBulkDeleteConfirm(false);
      toast.success(`${ids.length} محصول حذف شد`);
    } catch {
      toast.error('خطا در حذف دسته‌ای');
    }
  }, [deleteProductMutation, selectedProducts]);

  const toggleProductSelection = useCallback((productId: number) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  }, [filteredProducts, selectedProducts.size]);

  const handleExportCSV = useCallback(() => {
    const headers = ['نام', 'قیمت', 'موجودی', 'SKU', 'وضعیت'];
    const rows = filteredProducts.map((p) => [p.name, p.price, p.stock, p.sku || '-', p.is_active ? 'فعال' : 'غیرفعال']);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('فایل CSV دانلود شد');
  }, [filteredProducts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setShowAddModal(true); }
      else if (e.key === '/' && !showAddModal && !showEditModal) { e.preventDefault(); searchInputRef.current?.focus(); }
      else if (e.key === 'Escape') {
        setShowAddModal(false); setShowEditModal(false); setEditingProductId(null);
        setShowQuickView(null); setShowDeleteConfirm(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, showEditModal]);

  const getStatusBadge = useCallback((product: Product) => {
    if (product.stock === 0) return (<Badge variant="error" size="sm" className="gap-1"><AlertCircle className="w-3 h-3" />ناموجود</Badge>);
    if (!product.is_active) return (<Badge variant="gray" size="sm" className="gap-1"><XCircle className="w-3 h-3" />غیرفعال</Badge>);
    if (product.stock < 10) return (<Badge variant="warning" size="sm" className="gap-1"><AlertCircle className="w-3 h-3" />کم</Badge>);
    return (<Badge variant="success" size="sm" className="gap-1"><CheckCircle className="w-3 h-3" />فعال</Badge>);
  }, []);

  if (isLoading) {
    return (
      <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="animate-pulse mb-4">
          <div className="h-8 bg-gray-200 rounded w-56 mb-1.5" />
          <div className="h-3 bg-gray-200 rounded w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-3 border border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-12 mb-1.5" />
              <div className="h-5 bg-gray-200 rounded w-10" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (<ProductSkeleton key={i} />))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-error-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-1.5">خطا در بارگذاری</h3>
          <p className="text-gray-600 text-sm mb-4">مشکلی در ارتباط با سرور رخ داده است</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} size="md" className="gap-1.5"><RefreshCw className="w-4 h-4" />تلاش مجدد</Button>
            <Button variant="outline" size="md" onClick={() => navigate('/seller')}>بازگشت</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-1.5">
              مدیریت محصولات
              {isRefetching && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
            </h1>
            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
              <span>{filteredProducts.length} محصول از <span className="font-bold text-gray-900">{products.length}</span></span>
              {selectedProducts.size > 0 && (
                <Badge variant="primary" size="sm" className="gap-0.5">
                  <CheckSquare className="w-2.5 h-2.5" />{selectedProducts.size} انتخاب
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {selectedProducts.size > 0 && (
            <Button variant="danger" size="md" onClick={() => setShowBulkDeleteConfirm(true)} className="gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">حذف ({selectedProducts.size})</span>
            </Button>
          )}
          <Button variant="outline" size="md" onClick={handleExportCSV} className="gap-1.5" disabled={products.length === 0}>
            <Download className="w-4 h-4" /><span className="hidden md:inline">خروجی</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} size="md" className="gap-1.5 shadow-md shadow-primary-500/30">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">افزودن محصول</span>
            <span className="md:hidden">محصول</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <StatCard icon={Package} label="کل محصولات" value={stats.total} gradient="from-primary-500 to-primary-600" />
        <StatCard icon={CheckCircle} label="فعال" value={stats.active} gradient="from-success-500 to-success-600" />
        <StatCard icon={AlertCircle} label="ناموجود" value={stats.outOfStock} gradient="from-error-500 to-error-600" />
        <StatCard icon={XCircle} label="غیرفعال" value={stats.inactive} gradient="from-warning-500 to-warning-600" />
        <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl p-3 text-white shadow-md col-span-2 md:col-span-1 hover:shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] text-white/90 font-medium">ارزش انبار</span>
          </div>
          <p className="text-sm font-black">{formatPrice(stats.totalRevenue)}</p>
          {stats.lowStock > 0 && (
            <p className="text-[9px] text-white/80 mt-0.5 flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" />{stats.lowStock} کم‌موجود
            </p>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="جستجو... (برای فوکوس / را بزنید)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white cursor-pointer text-sm"
            >
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
              <option value="name_asc">نام (الف-ی)</option>
              <option value="name_desc">نام (ی-الف)</option>
              <option value="stock_asc">کم‌موجودی</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg">
            <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')} title="نمای جدولی">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')} title="نمای کارتی">
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-2 pt-2 border-t border-gray-100">
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
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                  isActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-3 h-3" />{filter.label}
                <span className={cn('px-1 py-0.5 rounded text-[10px]', isActive ? 'bg-white/20' : 'bg-gray-200')}>{filter.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Content */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title={searchQuery ? 'محصولی یافت نشد' : 'هنوز محصولی اضافه نکرده‌اید'}
            description={searchQuery ? `نتیجه‌ای برای "${searchQuery}" پیدا نشد` : 'اولین محصول خود را اضافه کنید'}
            action={!searchQuery && (
              <Button onClick={() => setShowAddModal(true)} size="md" className="gap-1.5">
                <Plus className="w-4 h-4" />افزودن محصول
              </Button>
            )}
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-l from-gray-50 to-white border-b border-gray-100">
                <tr>
                  <th className="text-right px-3 py-2.5 w-10">
                    <button onClick={toggleSelectAll} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-700">محصول</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-700">قیمت</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-700">موجودی</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-700">وضعیت</th>
                  <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-700">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  return (
                    <tr key={product.id} className={cn('transition-colors group', isSelected ? 'bg-primary-50/50' : 'hover:bg-primary-50/30')}>
                      <td className="px-3 py-2.5">
                        <button onClick={() => toggleProductSelection(product.id)} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-11 h-11 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                            {product.main_image ? (
                              <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (<span className="text-xl">📦</span>)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-600 transition-colors">{product.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-[10px] text-gray-500 font-mono">{product.sku || '-'}</p>
                              {product.category && (<><span className="text-gray-300">•</span><p className="text-[10px] text-gray-500">{product.category.name}</p></>)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="font-black text-gray-900 text-sm">{formatPrice(parseFloat(product.price))}</p>
                          {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                            <p className="text-[10px] text-gray-400 line-through">{formatPrice(parseFloat(product.discount_price))}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('font-black text-sm', product.stock === 0 ? 'text-error-600' : product.stock < 10 ? 'text-warning-600' : 'text-gray-900')}>
                            {product.stock}
                          </span>
                          {product.stock > 0 && product.stock < 10 && (<Badge variant="warning" size="sm">کم</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{getStatusBadge(product)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => setShowQuickView(product)} className="gap-0.5">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="xs" onClick={() => handleOpenEditModal(product.id)} className="gap-0.5">
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">ویرایش</span>
                          </Button>
                          <div className="relative">
                            <Button variant="ghost" size="xs" onClick={() => setShowDropdown(showDropdown === product.id ? null : product.id)}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                            {showDropdown === product.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(null)} />
                                <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden animate-slide-down">
                                  <MenuItem icon={Eye} label="مشاهده سریع" color="primary" onClick={() => { setShowQuickView(product); setShowDropdown(null); }} />
                                  <MenuItem icon={Edit} label="ویرایش" color="primary" onClick={() => handleOpenEditModal(product.id)} />
                                  <MenuItem icon={ExternalLink} label="مشاهده در سایت" color="primary" onClick={() => { navigate(`/products/${product.slug}`); setShowDropdown(null); }} />
                                  <MenuItem icon={Copy} label="کپی اطلاعات" color="gray" onClick={() => { navigator.clipboard.writeText(`${product.name}\n${product.price} تومان\n${product.stock} عدد`); toast.success('کپی شد'); setShowDropdown(null); }} />
                                  <div className="border-t border-gray-100" />
                                  <MenuItem icon={Trash2} label="حذف محصول" color="error" onClick={() => { setShowDeleteConfirm(product.id); setShowDropdown(null); }} />
                                </div>
                              </>
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
          <div className="md:hidden divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleProductSelection(product.id)} className="mt-1.5">
                    {selectedProducts.has(product.id) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.main_image ? (
                        <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (<span className="text-2xl">📦</span>)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm line-clamp-2 mb-0.5">{product.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{product.sku || '-'}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <p className="font-black text-primary-700 text-sm">{formatPrice(parseFloat(product.price))}</p>
                        {getStatusBadge(product)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500">موجودی:</span>
                    <span className={cn('font-bold', product.stock === 0 ? 'text-error-600' : product.stock < 10 ? 'text-warning-600' : 'text-gray-900')}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="xs" onClick={() => setShowQuickView(product)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="xs" onClick={() => handleOpenEditModal(product.id)}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="xs" onClick={() => setShowDeleteConfirm(product.id)} className="text-error-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const isSelected = selectedProducts.has(product.id);
            return (
              <div key={product.id} className={cn('group bg-white rounded-xl border-2 transition-all overflow-hidden', isSelected ? 'border-primary-500 shadow-md' : 'border-gray-100 hover:border-primary-300 hover:shadow-lg')}>
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                  {product.main_image ? (
                    <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  ) : (<span className="text-6xl">📦</span>)}
                  <button onClick={() => toggleProductSelection(product.id)} className={cn('absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all', isSelected ? 'bg-primary-500 text-white' : 'bg-white/80 backdrop-blur-sm text-gray-600 opacity-0 group-hover:opacity-100')}>
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  </button>
                  <div className="absolute top-2 left-2">{getStatusBadge(product)}</div>
                  {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                    <div className="absolute bottom-2 right-2 bg-gradient-to-br from-error-500 to-error-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black shadow-md">
                      {Math.round(((parseFloat(product.price) - parseFloat(product.discount_price)) / parseFloat(product.price)) * 100)}٪
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setShowQuickView(product)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-lg hover:scale-110"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenEditModal(product.id)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-lg hover:scale-110"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setShowDeleteConfirm(product.id)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-error-600 hover:text-white transition-all shadow-lg hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1.5 min-h-[2.5rem] group-hover:text-primary-600 transition-colors">{product.name}</h3>
                  <p className="text-[10px] text-gray-500 font-mono mb-2">{product.sku || '-'}</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-base font-black text-primary-700">{formatPrice(parseFloat(product.price))}</span>
                    {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                      <span className="text-[10px] text-gray-400 line-through">{formatPrice(parseFloat(product.discount_price))}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className={cn('text-xs font-bold flex items-center gap-0.5', product.stock === 0 ? 'text-error-600' : product.stock < 10 ? 'text-warning-600' : 'text-gray-700')}>
                      <Package className="w-3 h-3" />{product.stock}
                    </span>
                    {product.category && (<Badge variant="gray" size="sm">{product.category.name}</Badge>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick View Modal */}
      {showQuickView && (
        <Modal isOpen={!!showQuickView} onClose={() => setShowQuickView(null)} size="lg" title={showQuickView.name}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
              {showQuickView.main_image ? (
                <img src={showQuickView.main_image} alt={showQuickView.name} className="w-full h-full object-cover" />
              ) : (<span className="text-8xl">📦</span>)}
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{showQuickView.name}</h3>
                {showQuickView.sku && (<p className="text-xs text-gray-500 font-mono">SKU: {showQuickView.sku}</p>)}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary-700">{formatPrice(parseFloat(showQuickView.price))}</span>
                {showQuickView.discount_price && parseFloat(showQuickView.discount_price) < parseFloat(showQuickView.price) && (
                  <span className="text-sm text-gray-400 line-through">{formatPrice(parseFloat(showQuickView.discount_price))}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InfoCard icon={Package} label="موجودی" value={showQuickView.stock.toString()} color={showQuickView.stock === 0 ? 'error' : showQuickView.stock < 10 ? 'warning' : 'success'} />
                <InfoCard icon={CheckCircle} label="وضعیت" value={showQuickView.is_active ? 'فعال' : 'غیرفعال'} color={showQuickView.is_active ? 'success' : 'gray'} />
              </div>
              {showQuickView.description && (
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">توضیحات</h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{showQuickView.description}</p>
                </div>
              )}
              <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                <Button onClick={() => handleOpenEditModal(showQuickView.id)} className="flex-1 gap-1.5" size="md">
                  <Edit className="w-4 h-4" />ویرایش
                </Button>
                <Button variant="outline" onClick={() => { navigate(`/products/${showQuickView.slug}`); setShowQuickView(null); }} className="gap-1.5" size="md">
                  <ExternalLink className="w-4 h-4" />مشاهده
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm !== null} onClose={() => setShowDeleteConfirm(null)} size="sm" title="حذف محصول">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-error-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1.5">آیا مطمئن هستید؟</h3>
          <p className="text-gray-600 text-sm mb-4">این عمل غیرقابل بازگشت است.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="md" onClick={() => setShowDeleteConfirm(null)}>انصراف</Button>
            <Button variant="danger" className="flex-1" size="md" onClick={() => handleDelete(showDeleteConfirm!)} disabled={deleteProductMutation.isPending}>
              {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1.5" /> : <Trash2 className="w-4 h-4 ml-1.5" />}حذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation */}
      <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} size="sm" title="حذف دسته‌ای">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-error-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1.5">حذف {selectedProducts.size} محصول؟</h3>
          <p className="text-gray-600 text-sm mb-4">این عمل غیرقابل بازگشت است.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="md" onClick={() => setShowBulkDeleteConfirm(false)}>انصراف</Button>
            <Button variant="danger" className="flex-1" size="md" onClick={handleBulkDelete} disabled={deleteProductMutation.isPending}>
              {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1.5" /> : <Trash2 className="w-4 h-4 ml-1.5" />}حذف همه
            </Button>
          </div>
        </div>
      </Modal>

      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      {editingProductId && (
        <EditProductModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingProductId(null); }}
          productId={editingProductId}
        />
      )}
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: number; gradient: string }) => (
  <div className={cn('bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all group cursor-pointer hover:scale-105')}>
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className={cn('w-7 h-7 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform', gradient)}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-[10px] text-gray-600 font-medium">{label}</span>
    </div>
    <p className="text-base font-black text-gray-900">{value.toLocaleString('fa-IR')}</p>
  </div>
);

const MenuItem = ({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: 'primary' | 'error' | 'gray'; onClick: () => void }) => {
  const colorClasses = { primary: 'hover:bg-primary-50 text-gray-700 hover:text-primary-700', error: 'hover:bg-error-50 text-error-600', gray: 'hover:bg-gray-50 text-gray-700' };
  const iconBgClasses = { primary: 'bg-primary-100 text-primary-600', error: 'bg-error-100 text-error-600', gray: 'bg-gray-100 text-gray-600' };
  return (
    <button onClick={onClick} className={cn('w-full text-right px-3 py-2 transition-colors flex items-center gap-2 text-xs font-medium', colorClasses[color])}>
      <div className={cn('w-6 h-6 rounded flex items-center justify-center', iconBgClasses[color])}><Icon className="w-3 h-3" /></div>
      {label}
    </button>
  );
};

const InfoCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: 'success' | 'warning' | 'error' | 'gray' }) => {
  const colorClasses = { success: 'bg-success-50 text-success-700 border-success-200', warning: 'bg-warning-50 text-warning-700 border-warning-200', error: 'bg-error-50 text-error-700 border-error-200', gray: 'bg-gray-50 text-gray-700 border-gray-200' };
  return (
    <div className={cn('rounded-lg p-2 border', colorClasses[color])}>
      <div className="flex items-center gap-1 mb-0.5"><Icon className="w-3 h-3" /><span className="text-[10px] font-medium">{label}</span></div>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
};