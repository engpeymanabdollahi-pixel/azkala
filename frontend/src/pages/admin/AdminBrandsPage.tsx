import { useState } from 'react';
import {
  Award, Edit2, Trash2, Eye, Plus, Package,
  CheckCircle, XCircle, Crown, Gem, Star, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CrudTable, type ColumnDef, type FilterConfig, type ActionConfig, type BulkActionConfig } from '@/features/admin/components/CrudTable';
import {
  adminBrandService,
  type AdminBrand,
  type BrandFormData,
} from '@/services/api/adminBrand.service';
import { useCrudMutations } from '@/features/admin/hooks';
import toast from 'react-hot-toast';

type ModalMode = 'create' | 'edit' | 'view';

export function AdminBrandsPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<AdminBrand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    slug: '',
    description: '',
    country: '',
    website: '',
    logo: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
  });

  // ✅ استفاده از useCrudMutations
  const { createMutation, updateMutation, deleteMutation, bulkActionMutation } = useCrudMutations({
    queryKeys: ['admin/brands'],
    successMessages: {
      create: 'برند با موفقیت ایجاد شد',
      update: 'برند با موفقیت به‌روزرسانی شد',
      delete: 'برند با موفقیت حذف شد',
      bulk: 'عملیات گروهی با موفقیت انجام شد',
    },
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedBrand(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      country: '',
      website: '',
      logo: '',
      is_active: true,
      is_featured: false,
      sort_order: 0,
    });
  };

  const handleEdit = (brand: AdminBrand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      country: brand.country || '',
      website: brand.website || '',
      logo: brand.logo || '',
      is_active: brand.is_active,
      is_featured: brand.is_featured,
      sort_order: brand.sort_order || 0,
    });
    setModalMode('edit');
  };

  const handleView = (brand: AdminBrand) => {
    setSelectedBrand(brand);
    setModalMode('view');
  };

  const handleCreate = () => {
    setModalMode('create');
  };

  const handleSubmit = () => {
    if (modalMode === 'create') {
      createMutation.mutate({
        endpoint: '/admin/brands',
        data: formData,
      });
      closeModal();
    } else if (modalMode === 'edit' && selectedBrand) {
      updateMutation.mutate({
        endpoint: '/admin/brands',
        id: selectedBrand.id,
        data: formData,
      });
      closeModal();
    }
  };

  // Column definitions
  const columns: ColumnDef<AdminBrand>[] = [
    {
      key: 'name',
      label: 'نام برند',
      sortable: true,
      render: (value, brand) => (
        <div className="flex items-center gap-3">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold">
              {brand.name?.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-900">{brand.name}</div>
            <div className="text-xs text-gray-500">{brand.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'وضعیت',
      render: (value) => (
        <Badge variant={value ? 'success' : 'error'} size="sm">
          {value ? 'فعال' : 'غیرفعال'}
        </Badge>
      ),
    },
    {
      key: 'is_featured',
      label: 'ویژه',
      render: (value) => (
        value ? (
          <Badge variant="accent" size="sm">
            <Star className="w-3 h-3 ml-1" />
            ویژه
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'verification_badge',
      label: 'نشان',
      render: (value) => {
        const badgeMap: Record<string, { label: string; color: string; icon: any }> = {
          none: { label: 'بدون نشان', color: 'gray', icon: Award },
          gold: { label: 'طلایی', color: 'warning', icon: Crown },
          platinum: { label: 'پلاتینیوم', color: 'primary', icon: Gem },
          diamond: { label: 'الماس', color: 'accent', icon: Gem },
        };
        const badge = badgeMap[value || 'none'];
        const Icon = badge.icon;
        return (
          <Badge variant={badge.color as any} size="sm">
            <Icon className="w-3 h-3 ml-1" />
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: 'products_count',
      label: 'محصولات',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Package className="w-4 h-4" />
          <span className="font-semibold">{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'کشور',
      render: (value) => value || <span className="text-gray-400">-</span>,
    },
  ];

  // Filter definitions
  const filters: FilterConfig[] = [
    {
      key: 'is_active',
      label: 'وضعیت',
      type: 'select',
      options: [
        { label: 'فعال', value: '1' },
        { label: 'غیرفعال', value: '0' },
      ],
    },
    {
      key: 'is_featured',
      label: 'ویژه',
      type: 'select',
      options: [
        { label: 'ویژه', value: '1' },
        { label: 'معمولی', value: '0' },
      ],
    },
    {
      key: 'verified',
      label: 'تأیید شده',
      type: 'select',
      options: [
        { label: 'تأیید شده', value: '1' },
        { label: 'تأیید نشده', value: '0' },
      ],
    },
  ];

  // Action definitions
  const actions: ActionConfig<AdminBrand>[] = [
    {
      label: 'مشاهده',
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
      variant: 'ghost',
    },
    {
      label: 'ویرایش',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'ghost',
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (brand) => {
        if (confirm(`آیا از حذف برند "${brand.name}" مطمئن هستید؟`)) {
          deleteMutation.mutate({
            endpoint: '/admin/brands',
            id: brand.id,
          });
        }
      },
      variant: 'danger',
      show: (brand) => brand.products_count === 0,
    },
  ];

  // Bulk action definitions
  const bulkActions: BulkActionConfig[] = [
    {
      label: 'فعال کردن',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: async (ids) => {
        await bulkActionMutation.mutateAsync({
          endpoint: '/admin/brands',
          ids,
          action: 'activate',
        });
      },
      variant: 'primary',
    },
    {
      label: 'غیرفعال کردن',
      icon: <XCircle className="w-4 h-4" />,
      onClick: async (ids) => {
        await bulkActionMutation.mutateAsync({
          endpoint: '/admin/brands',
          ids,
          action: 'deactivate',
        });
      },
      variant: 'outline',
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: async (ids) => {
        if (confirm(`آیا از حذف ${ids.length} برند مطمئن هستید؟`)) {
          await bulkActionMutation.mutateAsync({
            endpoint: '/admin/brands',
            ids,
            action: 'delete',
          });
        }
      },
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-6">
      {/* CrudTable */}
      <CrudTable
        endpoint="/admin/brands"
        columns={columns}
        filters={filters}
        actions={actions}
        bulkActions={bulkActions}
        title="مدیریت برندها"
        enableSelection={true}
        onAdd={handleCreate}
        addLabel="افزودن برند جدید"
        dataKey="brands"
      />

      {/* Create/Edit Modal */}
      {modalMode && modalMode !== 'view' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={modalMode === 'create' ? 'افزودن برند جدید' : 'ویرایش برند'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="نام برند"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="نامک (Slug)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generate"
              />
            </div>

            <Input
              label="توضیحات"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="کشور"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <Input
                label="وب‌سایت"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <Input
              label="لوگو (URL)"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ترتیب نمایش"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium">فعال</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium">ویژه</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
                fullWidth
              >
                {modalMode === 'create' ? 'ایجاد برند' : 'ذخیره تغییرات'}
              </Button>
              <Button variant="outline" onClick={closeModal} fullWidth>
                انصراف
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {modalMode === 'view' && selectedBrand && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="جزئیات برند"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {selectedBrand.logo ? (
                <img src={selectedBrand.logo} alt={selectedBrand.name} className="w-20 h-20 rounded-xl object-cover" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                  {selectedBrand.name?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{selectedBrand.name}</h3>
                <p className="text-gray-500 text-sm">{selectedBrand.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">وضعیت</label>
                <div>
                  <Badge variant={selectedBrand.is_active ? 'success' : 'error'}>
                    {selectedBrand.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">ویژه</label>
                <div>
                  <Badge variant={selectedBrand.is_featured ? 'accent' : 'secondary'}>
                    {selectedBrand.is_featured ? 'ویژه' : 'معمولی'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">کشور</label>
                <div className="font-medium">{selectedBrand.country || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">وب‌سایت</label>
                <div className="font-medium">{selectedBrand.website || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">تعداد محصولات</label>
                <div className="font-medium">{selectedBrand.products_count || 0}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">ترتیب نمایش</label>
                <div className="font-medium">{selectedBrand.sort_order || 0}</div>
              </div>
            </div>

            {selectedBrand.description && (
              <div>
                <label className="text-xs text-gray-500">توضیحات</label>
                <p className="text-sm mt-1">{selectedBrand.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => handleEdit(selectedBrand)} fullWidth>
                ویرایش
              </Button>
              <Button variant="outline" onClick={closeModal} fullWidth>
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}