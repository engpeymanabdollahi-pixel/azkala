import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FolderTree, Search, Plus, Edit2, Trash2, Eye, EyeOff,
  ChevronRight, ChevronDown, X, Package,
  Tag, Save, RefreshCw, Filter, Layers, List,
  GripVertical, CheckCircle, XCircle, Clock, Sparkles,
  Palette, Globe, ExternalLink,
  Folder, FolderOpen,
  Smartphone, Laptop, Headphones, Camera, Watch,
  Tablet, Monitor, Keyboard, Mouse, Speaker,
  Gamepad2, Tv, Cpu, HardDrive, Usb,
  Shirt, ShoppingBag, Gift, Box,
  Home, Car, Bike, Plane, Train,
  Book, GraduationCap, PenTool, Brush,
  Coffee, UtensilsCrossed, Pizza, Apple, Cake,
  Heart, Star, Sun, Moon, Cloud,
  Music, Film, Mic, Radio, Disc,
  Dumbbell, Trophy, Medal, Award,
  Baby, Dog, Cat, Fish, Bird,
  Zap, Flame, Crown, Gem, Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  adminCategoryService,
  type AdminCategory,
  type CategoryFilters,
  type CategoryTreeNode,
  type CategoryFormData,
} from '@/services/api/adminCategory.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

// ==================== Types ====================

type ViewMode = 'tree' | 'list';
type TypeFilter = 'all' | 'permanent' | 'temporary';
type StatusFilter = 'all' | 'active' | 'inactive';
type ModalTab = 'basic' | 'seo' | 'tags' | 'campaign';

// ==================== Icon Picker ====================

const AVAILABLE_ICONS = [
  'Smartphone', 'Laptop', 'Headphones', 'Camera', 'Watch',
  'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Speaker',
  'Gamepad2', 'Tv', 'Cpu', 'HardDrive', 'Usb',
  'Shirt', 'ShoppingBag', 'Gift', 'Box', 'Package',
  'Home', 'Car', 'Bike', 'Plane', 'Train',
  'Book', 'GraduationCap', 'PenTool', 'Brush', 'Palette',
  'Coffee', 'UtensilsCrossed', 'Pizza', 'Apple', 'Cake',
  'Heart', 'Star', 'Sun', 'Moon', 'Cloud',
  'Music', 'Film', 'Mic', 'Radio', 'Disc',
  'Dumbbell', 'Trophy', 'Medal', 'Award', 'Crown',
  'Baby', 'Dog', 'Cat', 'Fish', 'Bird',
  'Zap', 'Flame', 'Gem', 'Rocket', 'Folder',
];

const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    Smartphone, Laptop, Headphones, Camera, Watch,
    Tablet, Monitor, Keyboard, Mouse, Speaker,
    Gamepad2, Tv, Cpu, HardDrive, Usb,
    Shirt, ShoppingBag, Gift, Box, Package,
    Home, Car, Bike, Plane, Train,
    Book, GraduationCap, PenTool, Brush, Palette,
    Coffee, UtensilsCrossed, Pizza, Apple, Cake,
    Heart, Star, Sun, Moon, Cloud,
    Music, Film, Mic, Radio, Disc,
    Dumbbell, Trophy, Medal, Award, Crown,
    Baby, Dog, Cat, Fish, Bird,
    Zap, Flame, Gem, Rocket, Folder,
  };
  return iconMap[iconName || ''] || Folder;
};

// ==================== Main Component ====================

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  // State ها
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [filters, setFilters] = useState<CategoryFilters>({
    sort_by: 'sort_order',
    sort_order: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  // ==================== Queries ====================

  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: () => adminCategoryService.getCategoryTree(),
    enabled: viewMode === 'tree',
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['admin-categories-list', filters],
    queryFn: () => adminCategoryService.getCategories(filters),
    keepPreviousData: true,
    enabled: viewMode === 'list',
  });

  // ✅ آمار همیشه load می‌شود
  const { data: statsData } = useQuery({
    queryKey: ['admin-categories-stats'],
    queryFn: () => adminCategoryService.getCategories({ per_page: 1 }),
  });

  const tree = treeData?.data?.tree || [];
  const categories = listData?.data?.categories || [];
  const stats = statsData?.data?.stats;

  // ==================== Mutations ====================

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCategoryService.deleteCategory(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-stats'] });
      toast.success(response.message, { icon: '✅' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در حذف');
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: any }) =>
      adminCategoryService.bulkAction(ids, action),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-stats'] });
      toast.success(response.message, { icon: '✅' });
      setSelectedIds([]);
    },
    onError: () => toast.error('خطا در عملیات'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: any[]) => adminCategoryService.reorderCategories(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      toast.success('ترتیب به‌روزرسانی شد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در به‌روزرسانی ترتیب'),
  });

  // ==================== DnD Sensors ====================

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ==================== Handlers ====================

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value || undefined }));
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleTypeFilter = (type: TypeFilter) => {
    setTypeFilter(type);
    setFilters(prev => ({
      ...prev,
      type: type === 'all' ? undefined : type,
    }));
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      is_active: status === 'all' ? undefined : status === 'active',
    }));
  };

  const handleToggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (nodes: CategoryTreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children.length > 0) collectIds(node.children);
      });
    };
    collectIds(tree);
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => setExpandedIds(new Set());

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  // ✅ دریافت داده کامل از API برای ویرایش
  const handleOpenEditModal = async (node: CategoryTreeNode | AdminCategory) => {
    try {
      const response = await adminCategoryService.getCategory(node.id);
      if (response.success) {
        setEditingCategory(response.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error loading category:', error);
      toast.error('خطا در دریافت اطلاعات دسته');
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`آیا از حذف دسته "${name}" مطمئن هستید؟`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tree.findIndex(c => c.id === active.id);
    const newIndex = tree.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTree = arrayMove(tree, oldIndex, newIndex);
      const items = newTree.map((cat, idx) => ({
        id: cat.id,
        sort_order: idx + 1,
      }));
      reorderMutation.mutate(items);
    }
  };

  const handleSelectAll = () => {
    if (viewMode === 'list') {
      if (selectedIds.length === categories.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(categories.map(c => c.id));
      }
    }
  };

  const handleSelectCategory = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
    queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
    queryClient.invalidateQueries({ queryKey: ['admin-categories-stats'] });
  };

  // ==================== Render ====================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <FolderTree className="w-5 h-5 text-white" />
            </div>
            مدیریت دسته‌بندی‌ها
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            سازماندهی، مدیریت و بهینه‌سازی دسته‌بندی‌های محصولات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
          <Button onClick={handleOpenCreateModal} className="gap-1.5">
            <Plus className="w-4 h-4" />
            دسته جدید
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="کل دسته‌ها" value={stats?.total || 0} icon={FolderTree} color="primary" />
        <StatCard label="فعال" value={stats?.active || 0} icon={CheckCircle} color="success" />
        <StatCard label="غیرفعال" value={stats?.inactive || 0} icon={XCircle} color="gray" />
        <StatCard label="موقت" value={stats?.temporary || 0} icon={Clock} color="warning" />
        <StatCard label="ریشه" value={stats?.root || 0} icon={Layers} color="accent" />
        <StatCard label="دارای محصول" value={stats?.with_products || 0} icon={Package} color="primary" />
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در نام، slug یا توضیحات..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5',
                viewMode === 'tree'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <FolderTree className="w-3.5 h-3.5" />
              درختی
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="w-3.5 h-3.5" />
              لیستی
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5" />
            نوع:
          </span>
          {[
            { value: 'all', label: 'همه', icon: FolderTree },
            { value: 'permanent', label: 'دائمی', icon: CheckCircle },
            { value: 'temporary', label: 'موقت/کمپین', icon: Clock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => handleTypeFilter(item.value as TypeFilter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  typeFilter === item.value
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5" />
            وضعیت:
          </span>
          {[
            { value: 'all', label: 'همه', icon: FolderTree },
            { value: 'active', label: 'فعال', icon: CheckCircle },
            { value: 'inactive', label: 'غیرفعال', icon: EyeOff },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => handleStatusFilter(item.value as StatusFilter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  statusFilter === item.value
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && viewMode === 'list' && (
          <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-bold text-primary-700">
                {selectedIds.length} دسته انتخاب شده
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'activate' })}
                disabled={bulkMutation.isPending}
              >
                <CheckCircle className="w-3.5 h-3.5 ml-1" />
                فعال‌سازی
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'deactivate' })}
                disabled={bulkMutation.isPending}
              >
                <EyeOff className="w-3.5 h-3.5 ml-1" />
                غیرفعال
              </Button>
              <Button
                size="sm"
                variant="error"
                onClick={() => {
                  if (window.confirm(`آیا از حذف ${selectedIds.length} دسته مطمئن هستید؟`)) {
                    bulkMutation.mutate({ ids: selectedIds, action: 'delete' });
                  }
                }}
                disabled={bulkMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                حذف
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tree View */}
        {viewMode === 'tree' && (
          <>
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExpandAll}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  باز کردن همه
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleCollapseAll}
                  className="text-xs font-bold text-gray-600 hover:text-gray-700 flex items-center gap-1"
                >
                  <Folder className="w-3.5 h-3.5" />
                  بستن همه
                </button>
              </div>
              <p className="text-xs text-gray-500">
                💡 برای تغییر ترتیب، دسته‌ها را بکشید و رها کنید
              </p>
            </div>

            {treeLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <EmptyState
                icon={<FolderTree className="w-12 h-12" />}
                title="دسته‌بندی وجود ندارد"
                description="اولین دسته‌بندی خود را ایجاد کنید"
                action={
                  <Button onClick={handleOpenCreateModal}>
                    <Plus className="w-4 h-4 ml-1" />
                    ایجاد دسته جدید
                  </Button>
                }
              />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tree.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-gray-100">
                    {tree.map((node) => (
                      <SortableTreeNode
                        key={node.id}
                        node={node}
                        level={0}
                        expandedIds={expandedIds}
                        onToggleExpand={handleToggleExpand}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {listLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <EmptyState
                icon={<FolderTree className="w-12 h-12" />}
                title="دسته‌بندی یافت نشد"
                description="با فیلترهای فعلی هیچ دسته‌ای وجود ندارد"
                action={
                  <Button onClick={() => setFilters({ sort_by: 'sort_order', sort_order: 'asc' })} variant="outline">
                    پاک کردن فیلترها
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-3 text-right">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === categories.length && categories.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">دسته</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">نوع</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">محصولات</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">ترتیب</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">وضعیت</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const Icon = getIconComponent(cat.icon);
                      const isSelected = selectedIds.includes(cat.id);

                      return (
                        <tr
                          key={cat.id}
                          className={cn(
                            'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
                            isSelected && 'bg-primary-50/30'
                          )}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectCategory(cat.id)}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                  !cat.bg_color && 'bg-gradient-to-br from-primary-100 to-accent-100'
                                )}
                                style={cat.bg_color ? { backgroundColor: cat.bg_color } : {}}
                              >
                                <Icon
                                  className="w-5 h-5"
                                  style={cat.text_color ? { color: cat.text_color } : {}}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {cat.name}
                                </p>
                                <p className="text-[10px] text-gray-500 line-clamp-1">
                                  /{cat.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {cat.is_temporary ? (
                              <Badge variant="warning" size="sm">
                                <Clock className="w-3 h-3 ml-0.5" />
                                {cat.campaign_name || 'موقت'}
                              </Badge>
                            ) : (
                              <Badge variant="primary" size="sm">
                                <CheckCircle className="w-3 h-3 ml-0.5" />
                                دائمی
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm font-bold text-gray-700">
                                {cat.products_count}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm text-gray-700">{cat.sort_order}</span>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={cat.is_active ? 'success' : 'gray'} size="sm">
                              {cat.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3 ml-0.5" />
                                  فعال
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 ml-0.5" />
                                  غیرفعال
                                </>
                              )}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => window.open(`http://localhost:5173/products?category=${cat.slug}`, '_blank')}
                                className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                                title="پیش‌نمایش در سایت"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-1.5 hover:bg-accent-50 rounded-lg text-gray-500 hover:text-accent-600 transition-colors"
                                title="ویرایش"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id, cat.name)}
                                className="p-1.5 hover:bg-error-50 rounded-lg text-gray-500 hover:text-error-600 transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

// ==================== Sortable Tree Node ====================

function SortableTreeNode({
  node,
  level,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  node: CategoryTreeNode;
  level: number;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  onEdit: (node: CategoryTreeNode) => void;
  onDelete: (id: number, name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${level * 24 + 12}px`,
  };

  const Icon = getIconComponent(node.icon);
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 py-2.5 px-3 hover:bg-gray-50/50 transition-colors border-b border-gray-50',
          isDragging && 'opacity-50 bg-primary-50'
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button
          onClick={() => hasChildren && onToggleExpand(node.id)}
          className={cn(
            'p-1 rounded transition-colors',
            hasChildren ? 'hover:bg-gray-200 text-gray-600' : 'text-transparent cursor-default'
          )}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 line-clamp-1">{node.name}</p>
            {node.is_temporary && (
              <Badge variant="warning" size="sm" className="text-[9px]">
                <Clock className="w-2.5 h-2.5 ml-0.5" />
                موقت
              </Badge>
            )}
            {!node.is_active && (
              <Badge variant="gray" size="sm" className="text-[9px]">
                غیرفعال
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <Package className="w-2.5 h-2.5" />
              {node.products_count} محصول
            </span>
            {hasChildren && (
              <span className="flex items-center gap-0.5">
                <Layers className="w-2.5 h-2.5" />
                {node.children.length} زیرمجموعه
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(node)}
            className="p-1.5 hover:bg-accent-50 rounded-lg text-gray-500 hover:text-accent-600 transition-colors"
            title="ویرایش"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(node.id, node.name)}
            className="p-1.5 hover:bg-error-50 rounded-lg text-gray-500 hover:text-error-600 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render Children */}
      {isExpanded && hasChildren && (
        <SortableContext
          items={node.children.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {node.children.map((child) => (
            <SortableTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      )}
    </>
  );
}

// ==================== Sub Components ====================

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: any;
  color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
}) {
  const colors = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    error: 'text-error-600 bg-error-50',
    warning: 'text-warning-600 bg-warning-50',
    accent: 'text-accent-600 bg-accent-50',
    gray: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-black text-gray-900">{value.toLocaleString('fa-IR')}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ==================== Category Form Modal ====================

function CategoryFormModal({
  category,
  onClose,
}: {
  category: AdminCategory | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const [activeTab, setActiveTab] = useState<ModalTab>('basic');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    slug: category?.slug || '',
    parent_id: category?.parent_id || null,
    icon: category?.icon || '',
    image: category?.image || '',
    description: category?.description || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
    meta_title: category?.meta_title || '',
    meta_description: category?.meta_description || '',
    meta_keywords: category?.meta_keywords || '',
    tags: category?.tags || [],
    is_temporary: category?.is_temporary || false,
    campaign_name: category?.campaign_name || '',
    start_date: category?.start_date || '',
    end_date: category?.end_date || '',
    bg_color: category?.bg_color || '',
    text_color: category?.text_color || '',
  });
  const [newTag, setNewTag] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { data: allCategories } = useQuery({
    queryKey: ['admin-categories-list', { per_page: 100 }],
    queryFn: () => adminCategoryService.getCategories({ per_page: 100 }),
  });
  const categoriesList = allCategories?.data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => adminCategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-stats'] });
      toast.success('دسته‌بندی ایجاد شد', { icon: '✅' });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در ایجاد');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      adminCategoryService.updateCategory(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-stats'] });
      toast.success('دسته‌بندی به‌روزرسانی شد', { icon: '✅' });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در به‌روزرسانی');
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('نام دسته الزامی است');
      setActiveTab('basic');
      return;
    }
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (formData.tags?.includes(tag)) {
      toast.error('این تگ قبلاً اضافه شده');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tag],
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  const updateField = <K extends keyof CategoryFormData>(
    key: K,
    value: CategoryFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const tabs: { id: ModalTab; label: string; icon: any }[] = [
    { id: 'basic', label: 'اطلاعات پایه', icon: Folder },
    { id: 'seo', label: 'سئو', icon: Globe },
    { id: 'tags', label: 'تگ‌ها', icon: Tag },
    { id: 'campaign', label: 'کمپین', icon: Sparkles },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary-600" />
            {isEditing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  نام دسته <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    updateField('name', e.target.value);
                    if (!isEditing) {
                      updateField('slug', e.target.value.replace(/\s+/g, '-').toLowerCase());
                    }
                  }}
                  placeholder="مثلاً: گوشی موبایل"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="mobile-phones"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">دسته والد</label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => updateField('parent_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="">— بدون والد (دسته ریشه) —</option>
                  {categoriesList
                    .filter(c => !isEditing || c.id !== category.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="توضیحات دسته..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">آیکون</label>
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right flex items-center gap-2 hover:border-primary-500"
                  >
                    {formData.icon ? (
                      <>
                        {(() => { const Icon = getIconComponent(formData.icon); return <Icon className="w-4 h-4 text-primary-600" />; })()}
                        <span>{formData.icon}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">انتخاب آیکون...</span>
                    )}
                  </button>
                  {showIconPicker && (
                    <div className="mt-2 p-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto grid grid-cols-8 gap-1">
                      {AVAILABLE_ICONS.map((iconName) => {
                        const Icon = getIconComponent(iconName);
                        return (
                          <button
                            key={iconName}
                            onClick={() => {
                              updateField('icon', iconName);
                              setShowIconPicker(false);
                            }}
                            className={cn(
                              'p-2 rounded hover:bg-primary-50 transition-colors',
                              formData.icon === iconName && 'bg-primary-100 border border-primary-300'
                            )}
                            title={iconName}
                          >
                            <Icon className="w-4 h-4 text-gray-700 mx-auto" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">ترتیب نمایش</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">URL تصویر</label>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => updateField('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                />
                {formData.image && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <SafeImage src={formData.image} alt="preview" className="w-full h-full object-cover" fallbackEmoji="📷" />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <div>
                  <p className="text-sm font-bold text-gray-700">فعال</p>
                  <p className="text-[10px] text-gray-500">دسته در سایت نمایش داده می‌شود</p>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-xs text-primary-800 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  تنظیمات سئو برای بهبود رتبه در موتورهای جستجو
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title || ''}
                  onChange={(e) => updateField('meta_title', e.target.value)}
                  placeholder={formData.name || 'عنوان صفحه'}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">{(formData.meta_title || '').length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Meta Description</label>
                <textarea
                  value={formData.meta_description || ''}
                  onChange={(e) => updateField('meta_description', e.target.value)}
                  placeholder={formData.description || 'توضیحات صفحه...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Meta Keywords</label>
                <input
                  type="text"
                  value={formData.meta_keywords || ''}
                  onChange={(e) => updateField('meta_keywords', e.target.value)}
                  placeholder="کلمه1, کلمه2, کلمه3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-bold text-gray-700 mb-2">پیش‌نمایش گوگل:</p>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-blue-700 text-sm font-medium line-clamp-1">
                    {formData.meta_title || formData.name || 'عنوان دسته'}
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    azkala.com › categories › {formData.slug || 'slug'}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {formData.meta_description || formData.description || 'توضیحات دسته...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="p-3 bg-accent-50 border border-accent-200 rounded-lg">
                <p className="text-xs text-accent-800 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  تگ‌ها به بهبود جستجو و سئو کمک می‌کنند
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">افزودن تگ جدید</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="نام تگ را وارد کنید..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  />
                  <Button onClick={handleAddTag} size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    افزودن
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  تگ‌های موجود ({formData.tags?.length || 0})
                </label>
                {formData.tags && formData.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-xs font-bold text-primary-700"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="p-0.5 hover:bg-primary-200 rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">هنوز تگی اضافه نشده</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'campaign' && (
            <div className="space-y-4">
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-xs text-warning-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  دسته‌های موقت برای کمپین‌های فصلی و تبلیغاتی
                </p>
              </div>

              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_temporary}
                  onChange={(e) => updateField('is_temporary', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <div>
                  <p className="text-sm font-bold text-gray-700">این دسته موقت است</p>
                  <p className="text-[10px] text-gray-500">برای کمپین‌های فصلی و تبلیغاتی</p>
                </div>
              </label>

              {formData.is_temporary && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">نام کمپین</label>
                    <input
                      type="text"
                      value={formData.campaign_name || ''}
                      onChange={(e) => updateField('campaign_name', e.target.value)}
                      placeholder="مثلاً: کمپین نوروز ۱۴۰۵"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">تاریخ شروع</label>
                      <input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => updateField('start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">تاریخ پایان</label>
                      <input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => updateField('end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5" />
                        رنگ پس‌زمینه
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.bg_color || '#ffffff'}
                          onChange={(e) => updateField('bg_color', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.bg_color || ''}
                          onChange={(e) => updateField('bg_color', e.target.value)}
                          placeholder="#ffffff"
                          dir="ltr"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5" />
                        رنگ متن
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.text_color || '#000000'}
                          onChange={(e) => updateField('text_color', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.text_color || ''}
                          onChange={(e) => updateField('text_color', e.target.value)}
                          placeholder="#000000"
                          dir="ltr"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg border-2 border-dashed border-gray-300"
                    style={{
                      backgroundColor: formData.bg_color || '#ffffff',
                      color: formData.text_color || '#000000',
                    }}
                  >
                    <p className="text-xs opacity-70 mb-1">پیش‌نمایش:</p>
                    <div className="flex items-center gap-2">
                      {formData.icon && (() => {
                        const Icon = getIconComponent(formData.icon);
                        return <Icon className="w-6 h-6" />;
                      })()}
                      <p className="text-lg font-black">{formData.name || 'نام دسته'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            isLoading={isPending}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'به‌روزرسانی' : 'ایجاد'}
          </Button>
        </div>
      </div>
    </div>
  );
}