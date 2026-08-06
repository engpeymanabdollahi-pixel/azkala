import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Search, Plus, Download, Trash2, Edit, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Pagination } from './Pagination';

// Types
export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: { label: string; value: string | number }[];
  placeholder?: string;
}

export interface ActionConfig<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  show?: (row: T) => boolean;
}

export interface BulkActionConfig {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: number[]) => Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

export interface ExportConfig {
  enabled: boolean;
  formats: ('csv' | 'excel' | 'pdf')[];
  endpoint?: string;
}

interface CrudTableProps<T extends { id: number }> {
  endpoint: string;
  columns: ColumnDef<T>[];
  filters?: FilterConfig[];
  actions?: ActionConfig<T>[];
  bulkActions?: BulkActionConfig[];
  exportOptions?: ExportConfig;
  title?: string;
  enableSelection?: boolean;
  perPage?: number;
  onAdd?: () => void;
  addLabel?: string;
  dataKey?: string;
}

export function CrudTable<T extends { id: number }>({
  endpoint,
  columns,
  filters = [],
  actions = [],
  bulkActions = [],
  exportOptions,
  title,
  enableSelection = false,
  perPage = 20,
  onAdd,
  addLabel = 'افزودن جدید',
    dataKey,
}: CrudTableProps<T>) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (search) params.search = search;

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    return params;
  }, [page, perPage, search, filterValues, sortBy, sortOrder]);

  // Fetch data
    const { data, isLoading, error, refetch } = useQuery({
    queryKey: [endpoint, queryParams],
    queryFn: async () => {
      const response = await apiClient.get(endpoint, { params: queryParams });
      const responseData = response.data.data;
      
      // ✅ اگر dataKey مشخص شده، داده‌ها را از آن کلید استخراج کن
      if (dataKey && responseData[dataKey]) {
        return {
          data: responseData[dataKey],
          pagination: responseData.pagination,
          stats: responseData.stats,
        };
      }
      
      // ✅ در غیر این صورت، فرض کن data مستقیماً آرایه است
      if (Array.isArray(responseData)) {
        return {
          data: responseData,
          pagination: null,
        };
      }
      
      // ✅ یا ساختار استاندارد { data: [], pagination: {} }
      return {
        data: responseData.data || responseData,
        pagination: responseData.pagination,
        stats: responseData.stats,
      };
    },
  });

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.data) {
      setSelectedIds(data.data.map((item: T) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

   const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!exportOptions?.endpoint) {
      toast.error('Endpoint صادرات تعریف نشده است');
      return;
    }

    try {
      const response = await apiClient.get(exportOptions.endpoint, {
        params: { ...queryParams, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('فایل با موفقیت دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود فایل');
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
        <p className="text-red-800 dark:text-red-400 font-semibold">خطا در دریافت داده‌ها</p>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{(error as Error).message}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
          <RefreshCw className="w-4 h-4 ml-2" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const items = data?.data || [];
  const pagination = data?.pagination;
  const totalColumns = columns.length + (enableSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">{title || 'مدیریت داده‌ها'}</h2>
        <div className="flex gap-2">
          {exportOptions?.enabled && (
            <Select
              placeholder="خروجی گرفتن"
              options={exportOptions.formats.map(format => ({
                label: format === 'excel' ? 'Excel' : format.toUpperCase(),
                value: format,
              }))}
              onValueChange={(value) => handleExport(value as any)}
            />
          )}
          {onAdd && (
            <Button onClick={onAdd} leftIcon={<Plus className="w-4 h-4" />}>
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          />
        </div>

        {/* Custom Filters */}
        {filters.map(filter => (
          <div key={filter.key} className="min-w-[180px]">
            {filter.type === 'select' ? (
              <Select
                placeholder={filter.label}
                options={[
                  { label: 'همه', value: '' },
                  ...(filter.options || []),
                ]}
                value={filterValues[filter.key] || ''}
                onValueChange={(value) => {
                  setFilterValues({ ...filterValues, [filter.key]: value });
                  setPage(1);
                }}
              />
            ) : (
              <Input
                placeholder={filter.label}
                value={filterValues[filter.key] || ''}
                onChange={(e) => {
                  setFilterValues({ ...filterValues, [filter.key]: e.target.value });
                  setPage(1);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {enableSelection && selectedIds.length > 0 && bulkActions.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
            {selectedIds.length} مورد انتخاب شده
          </span>
          <div className="flex gap-2 mr-auto">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={async () => {
                  try {
                    await action.onClick(selectedIds);
                    queryClient.invalidateQueries({ queryKey: [endpoint] });
                    setSelectedIds([]);
                    toast.success(action.label + ' با موفقیت انجام شد');
                  } catch (error) {
                    toast.error('خطا در انجام عملیات');
                  }
                }}
              >
                {action.icon}
                <span className="mr-2">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="داده‌ای یافت نشد"
            description="هیچ رکوردی با فیلترهای فعلی مطابقت ندارد"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900">
                {enableSelection && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedIds.length === items.length && items.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {columns.map(column => (
                  <TableHead
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className={cn(
                      column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortBy === String(column.key) && (
                        <span className="text-xs font-bold text-primary-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="w-[120px] text-center">عملیات</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: T) => (
                <TableRow key={item.id}>
                  {enableSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectRow(item.id, checked)}
                      />
                    </TableCell>
                  )}
                  {columns.map(column => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : String(item[column.key as keyof T] ?? '')}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {actions
                          .filter(action => !action.show || action.show(item))
                          .map((action, index) => (
                            <Button
                              key={index}
                              variant={action.variant || 'ghost'}
                              size="xs"
                              onClick={() => action.onClick(item)}
                              title={action.label}
                            >
                              {action.icon}
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          lastPage={pagination.last_page}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// Helper for cn
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}