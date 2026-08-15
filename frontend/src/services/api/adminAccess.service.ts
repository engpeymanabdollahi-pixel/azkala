import client from './client';
import type { AdministrativeRole } from '@/types/models';

// ==================== Types ====================
// ✅ این تایپ‌ها دقیقاً منطبق با AdminAccessController/AdminAccessService
// سمت بک‌اند نوشته شده‌اند (نه حدس) — رجوع به فرمت خروجی
// AdminAccessService::formatUserAccess / getPermissionsTaxonomy / getRoles.

export interface AdminAccessUser {
  id: number;
  name: string;
  phone: string;
  users_role: string; // customer/seller/admin/pending_seller — همیشه 'admin' در این لیست
  administrative_role: AdministrativeRole | null;
  direct_permissions: string[];
  effective_permissions: string[];
}

export interface AdminAccessUsersPage {
  current_page: number;
  data: AdminAccessUser[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminAccessRole {
  name: AdministrativeRole;
  permissions: string[];
}

export interface AdminAccessPermissionMeta {
  label: string;
  sensitive: boolean;
}

export interface AdminAccessPermissionModule {
  label: string;
  permissions: Record<string, AdminAccessPermissionMeta>;
}

export type AdminAccessPermissionsTaxonomy = Record<string, AdminAccessPermissionModule>;

// ==================== Service ====================

export const adminAccessService = {
  // ✅ search اختیاری (name/phone/email — سمت بک‌اند در
  // AdminAccessService::listUsers) — همان endpoint موجود، بدون
  // endpoint جدید.
  async getUsers(page = 1, perPage = 20, search?: string): Promise<{ success: boolean; data: AdminAccessUsersPage }> {
    const response = await client.get('/admin/access/users', {
      params: { page, per_page: perPage, search: search || undefined },
    });
    return response.data;
  },

  async getUser(id: number): Promise<{ success: boolean; data: AdminAccessUser }> {
    const response = await client.get(`/admin/access/users/${id}`);
    return response.data;
  },

  async getRoles(): Promise<{ success: boolean; data: AdminAccessRole[] }> {
    const response = await client.get('/admin/access/roles');
    return response.data;
  },

  async getPermissionsTaxonomy(): Promise<{ success: boolean; data: AdminAccessPermissionsTaxonomy }> {
    const response = await client.get('/admin/access/permissions');
    return response.data;
  },

  // role=null یعنی حذف کامل Administrative Access (کاربر همچنان
  // users.role=admin می‌ماند، فقط دیگر هیچ نقش/Permission ای ندارد).
  async updateRole(id: number, role: AdministrativeRole | null) {
    const response = await client.put(`/admin/access/users/${id}/role`, { role });
    return response.data;
  },

  // replace کامل (نه افزودن/حذف تکی) — دقیقاً معنای PUT سمت بک‌اند.
  async updatePermissions(id: number, permissions: string[]) {
    const response = await client.put(`/admin/access/users/${id}/permissions`, { permissions });
    return response.data;
  },
};
