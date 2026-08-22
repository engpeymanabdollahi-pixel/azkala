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
  email: string;
  // ✅ customer/seller/admin/pending_seller — بدون search همیشه 'admin'
  // است (رفتار قبلی)؛ با search می‌تواند هر مقداری باشد (بخش «فعال‌سازی
  // تخصیص Administrative Role به کاربران غیر-admin»).
  users_role: string;
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
// ✅ فاز ۷ (Tree View): ساختار پاسخ /admin/access/users/tree
export interface AdminAccessTreeNode {
  id: number;
  name: string;
  phone: string;
  email: string;
  users_role: string;
  administrative_role: AdministrativeRole | null;
  direct_permissions: string[];
  effective_permissions: string[];
  last_login_at: string | null;
}

export interface AdminAccessTree {
  groups: {
    super_admin: AdminAccessTreeNode[];
    admin: AdminAccessTreeNode[];
    manager: AdminAccessTreeNode[];
    none: AdminAccessTreeNode[];
  };
  counts: {
    super_admin: number;
    admin: number;
    manager: number;
    none: number;
  };
  total: number;
}

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
     // ✅ فاز ۷ (Tree View): استفاده از endpoint موجود برای گروه‌بندی
  // به‌جای endpoint جدید، از /users با per_page=1000 استفاده می‌کنیم
  // و در frontend گروه‌بندی می‌کنیم. این endpoint از قبل کار می‌کند.
  async getAccessTree(): Promise<{ success: boolean; data: AdminAccessTree }> {
    // دریافت همه کاربران admin در یک request (معمولاً کمتر از ۱۰۰ تا هستند)
    const response = await client.get('/admin/access/users', {
      params: { page: 1, per_page: 1000 },
    });

    const users = response.data?.data?.data ?? [];

    // گروه‌بندی بر اساس administrative_role
    const groups = {
      super_admin: [] as AdminAccessTreeNode[],
      admin: [] as AdminAccessTreeNode[],
      manager: [] as AdminAccessTreeNode[],
      none: [] as AdminAccessTreeNode[],
    };

    for (const user of users) {
      const role = user.administrative_role ?? 'none';
      const node: AdminAccessTreeNode = {
        ...user,
        last_login_at: null, // endpoint اصلی این را ندارد، در فاز بعدی اضافه می‌شود
      };
      groups[role].push(node);
    }

    return {
      success: true,
      data: {
        groups,
        counts: {
          super_admin: groups.super_admin.length,
          admin: groups.admin.length,
          manager: groups.manager.length,
          none: groups.none.length,
        },
        total: users.length,
      },
    };
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
