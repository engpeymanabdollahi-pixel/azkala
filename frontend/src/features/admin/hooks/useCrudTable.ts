import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';

// ==================== Types ====================

export interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CrudTableData<T> {
  data: T[];
  pagination: PaginationData | null;
  stats: Record<string, any> | null;
  extra: Record<string, any>;
}

export interface UseCrudTableOptions {
  endpoint: string;
  dataKey?: string; // کلید داده‌ها در پاسخ (مثلاً 'users', 'brands')
  defaultFilters?: Record<string, any>;
  defaultSort?: { by: string; order: 'asc' | 'desc' };
  perPage?: number;
  enabled?: boolean;
  queryKey?: (string | number | Record<string, any>)[];
}

// ==================== Hook ====================

export function useCrudTable<T extends { id: number }>({
  endpoint,
  dataKey,
  defaultFilters = {},
  defaultSort = { by: 'created_at', order: 'desc' },
  perPage = 20,
  enabled = true,
  queryKey,
}: UseCrudTableOptions) {
  // ==================== State ====================
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(defaultFilters);
  const [sortBy, setSortBy] = useState(defaultSort.by);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSort.order);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // ==================== Query Params ====================
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (search) params.search = search;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });

    return params;
  }, [page, perPage, search, filters, sortBy, sortOrder]);

  // ==================== Data Fetching ====================
  const query = useQuery({
    queryKey: queryKey || [endpoint, queryParams],
    queryFn: async (): Promise<CrudTableData<T>> => {
      const response = await apiClient.get(endpoint, { params: queryParams });
      const responseData = response.data.data;

      // اگر dataKey مشخص شده، داده‌ها را از آن کلید استخراج کن
      if (dataKey && responseData[dataKey]) {
        return {
          data: responseData[dataKey] as T[],
          pagination: responseData.pagination || null,
          stats: responseData.stats || null,
          extra: responseData,
        };
      }

      // اگر داده‌ها آرایه هستند
      if (Array.isArray(responseData)) {
        return {
          data: responseData as T[],
          pagination: null,
          stats: null,
          extra: {},
        };
      }

      // ساختار استاندارد
      return {
        data: (responseData.data || responseData) as T[],
        pagination: responseData.pagination || null,
        stats: responseData.stats || null,
        extra: responseData,
      };
    },
    enabled,
    keepPreviousData: true,
  });

  // ==================== Filter Handlers ====================
  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchState('');
    setPage(1);
  }, [defaultFilters]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  // ==================== Sort Handler ====================
  const setSort = useCallback((by: string, order?: 'asc' | 'desc') => {
    if (order) {
      setSortBy(by);
      setSortOrder(order);
    } else {
      setSortBy(by);
      setSortOrder(prev => sortBy === by ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    }
  }, [sortBy]);

  // ==================== Selection Handlers ====================
  const isSelected = useCallback((id: number) => selectedIds.includes(id), [selectedIds]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (query.data?.data) {
      setSelectedIds(query.data.data.map(item => item.id));
    }
  }, [query.data]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ==================== Refetch ====================
  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  // ==================== Return ====================
  return {
    // Data
    data: query.data?.data || [],
    pagination: query.data?.pagination || null,
    stats: query.data?.stats || null,
    extra: query.data?.extra || {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Filters
    filters,
    setFilter,
    clearFilters,
    search,
    setSearch,

    // Sort
    sortBy,
    sortOrder,
    setSort,

    // Pagination
    page,
    setPage,
    perPage,

    // Selection
    selectedIds,
    isSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    isAllSelected: query.data?.data
      ? selectedIds.length === query.data.data.length && query.data.data.length > 0
      : false,
    hasSelection: selectedIds.length > 0,

    // Refetch
    refetch,
  };
}