import apiClient from '@/services/api/client';

// ==================== Types ====================

export interface BulkValidateRow {
  row: number;
  data: Record<string, any>;
}

export interface BulkValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface BulkValidateResponse {
  valid_count: number;
  error_count: number;
  valid: BulkValidateRow[];
  errors: BulkValidationError[];
}

export interface BulkCommitResponse {
  created: number[];
  failed: { row: number; message: string }[];
}

// ==================== API Calls ====================

/**
 * دانلود Excel template برای bulk upload
 * GET /seller/products/bulk/template
 */
export const downloadBulkTemplate = async (): Promise<Blob> => {
  const response = await apiClient.get('/seller/products/bulk/template', {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * آپلود و validate فایل Excel
 * POST /seller/products/bulk/validate
 */
export const validateBulkFile = async (file: File): Promise<BulkValidateResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<{ success: boolean; data: BulkValidateResponse }>(
    '/seller/products/bulk/validate',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data;
};

/**
 * Commit محصولات معتبر و ایجاد در دیتابیس
 * POST /seller/products/bulk/commit
 */
export const commitBulkProducts = async (validRows: BulkValidateRow[]): Promise<BulkCommitResponse> => {
  const response = await apiClient.post<{ success: boolean; data: BulkCommitResponse; message: string }>(
    '/seller/products/bulk/commit',
    { valid_rows: validRows }
  );
  return response.data.data;
};