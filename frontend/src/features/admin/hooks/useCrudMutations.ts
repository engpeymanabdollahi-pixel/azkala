import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface MutationOptions {
  queryKeys: string[]; // کلیدهای query که باید invalidate شوند
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
    bulk?: string;
  };
}

interface CreateMutationParams {
  endpoint: string;
  data: any;
}

interface UpdateMutationParams {
  endpoint: string;
  id: number;
  data: any;
}

interface DeleteMutationParams {
  endpoint: string;
  id: number;
}

interface BulkActionParams {
  endpoint: string;
  ids: number[];
  action: string;
  extraData?: Record<string, any>;
}

// ==================== Hook ====================

export function useCrudMutations({
  queryKeys,
  successMessages = {},
}: MutationOptions) {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  // ==================== Create ====================
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: CreateMutationParams) => {
      const response = await apiClient.post(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success(successMessages.create || 'با موفقیت ایجاد شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در ایجاد');
    },
  });

  // ==================== Update ====================
  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: UpdateMutationParams) => {
      const response = await apiClient.put(`${endpoint}/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success(successMessages.update || 'با موفقیت به‌روزرسانی شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در به‌روزرسانی');
    },
  });

  // ==================== Delete ====================
  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: DeleteMutationParams) => {
      const response = await apiClient.delete(`${endpoint}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success(successMessages.delete || 'با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در حذف');
    },
  });

  // ==================== Bulk Action ====================
  const bulkActionMutation = useMutation({
    mutationFn: async ({ endpoint, ids, action, extraData = {} }: BulkActionParams) => {
      const response = await apiClient.post(`${endpoint}/bulk`, {
        ids,
        action,
        ...extraData,
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success(successMessages.bulk || 'عملیات با موفقیت انجام شد');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در عملیات گروهی');
    },
  });

  // ==================== Custom Mutation ====================
  const customMutation = useMutation({
    mutationFn: async ({ endpoint, method = 'POST', data, id }: {
      endpoint: string;
      method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: any;
      id?: number;
    }) => {
      const url = id ? `${endpoint}/${id}` : endpoint;
      const response = await apiClient({
        method,
        url,
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در عملیات');
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkActionMutation,
    customMutation,
    invalidateQueries,
  };
}