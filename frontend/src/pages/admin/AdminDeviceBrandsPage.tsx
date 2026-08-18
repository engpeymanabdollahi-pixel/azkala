import { useState } from 'react';
import { Edit2, Trash2, Eye, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CrudTable, type ColumnDef, type FilterConfig, type ActionConfig } from '@/features/admin/components/CrudTable';
import {
  type AdminDeviceBrand,
  type DeviceBrandFormData,
} from '@/services/api/adminDeviceBrand.service';
import { adminDeviceFamilyService } from '@/services/api/adminDeviceFamily.service';
import { useCrudMutations } from '@/features/admin/hooks';

type ModalMode = 'create' | 'edit' | 'view';

export function AdminDeviceBrandsPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<AdminDeviceBrand | null>(null);
  const [formData, setFormData] = useState<DeviceBrandFormData>({
    name: '',
    slug: '',
    family_id: null,
    is_active: true,
  });

  // ✅ Device-First Architecture فاز ۱E/۱H: خانواده‌های دستگاه دیگر enum
  // ثابتی در کد نیست — از API واقعی خوانده می‌شود (شامل غیرفعال‌ها هم،
  // چون این فرمِ ادمین است، نه فرم عمومی).
  const { data: familiesData } = useQuery({
    queryKey: ['admin/device-families', 'for-brand-form'],
    queryFn: () => adminDeviceFamilyService.getFamilies({ per_page: 100 }),
    staleTime: 60 * 1000,
  });
  const families = familiesData?.data.families ?? [];

  const { createMutation, updateMutation, deleteMutation } = useCrudMutations({
    queryKeys: ['admin/device-brands'],
    successMessages: {
      create: 'برند دستگاه با موفقیت ایجاد شد',
      update: 'برند دستگاه با موفقیت به‌روزرسانی شد',
      delete: 'برند دستگاه با موفقیت حذف شد',
    },
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedBrand(null);
    setFormData({ name: '', slug: '', family_id: null, is_active: true });
  };

  const handleEdit = (brand: AdminDeviceBrand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      family_id: brand.family_id,
      is_active: brand.is_active,
    });
    setModalMode('edit');
  };

  const handleView = (brand: AdminDeviceBrand) => {
    setSelectedBrand(brand);
    setModalMode('view');
  };

  const handleCreate = () => {
    setModalMode('create');
  };

  const handleSubmit = () => {
    if (modalMode === 'create') {
      createMutation.mutate({ endpoint: '/admin/device-brands', data: formData });
      closeModal();
    } else if (modalMode === 'edit' && selectedBrand) {
      updateMutation.mutate({ endpoint: '/admin/device-brands', id: selectedBrand.id, data: formData });
      closeModal();
    }
  };

  const columns: ColumnDef<AdminDeviceBrand>[] = [
    {
      key: 'name',
      label: 'نام برند',
      sortable: true,
      render: (_value, brand) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold">
            {brand.name?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-gray-100">{brand.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{brand.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'family',
      label: 'خانواده‌ی دستگاه',
      render: (_value, brand) => (
        <Badge variant={brand.family ? 'gray' : 'warning'} size="sm">
          <Smartphone className="w-3 h-3 ml-1" />
          {brand.family?.name || 'بدون خانواده'}
        </Badge>
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
  ];

  const filters: FilterConfig[] = [
    {
      key: 'family_id',
      label: 'خانواده‌ی دستگاه',
      type: 'select',
      options: families.map((f) => ({ label: f.name, value: String(f.id) })),
    },
    {
      key: 'is_active',
      label: 'وضعیت',
      type: 'select',
      options: [
        { label: 'فعال', value: '1' },
        { label: 'غیرفعال', value: '0' },
      ],
    },
  ];

  const actions: ActionConfig<AdminDeviceBrand>[] = [
    { label: 'مشاهده', icon: <Eye className="w-4 h-4" />, onClick: handleView, variant: 'ghost' },
    { label: 'ویرایش', icon: <Edit2 className="w-4 h-4" />, onClick: handleEdit, variant: 'ghost' },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (brand) => {
        if (confirm(`آیا از حذف برند دستگاه "${brand.name}" مطمئن هستید؟`)) {
          deleteMutation.mutate({ endpoint: '/admin/device-brands', id: brand.id });
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-6">
      <CrudTable
        endpoint="/admin/device-brands"
        columns={columns}
        filters={filters}
        actions={actions}
        title="مدیریت برندهای دستگاه"
        enableSelection={false}
        onAdd={handleCreate}
        addLabel="افزودن برند دستگاه جدید"
        dataKey="brands"
      />

      {modalMode && modalMode !== 'view' && (
        <Modal isOpen={true} onClose={closeModal} title={modalMode === 'create' ? 'افزودن برند دستگاه جدید' : 'ویرایش برند دستگاه'} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="نام برند" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="نامک (Slug)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generate" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">خانواده‌ی دستگاه</label>
              <select
                value={formData.family_id ?? ''}
                onChange={(e) => setFormData({ ...formData, family_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                required
              >
                <option value="">— انتخاب کنید —</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}{!f.is_active ? ' (غیرفعال)' : ''}</option>
                ))}
              </select>
              {families.length === 0 && (
                <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                  هنوز هیچ خانواده‌ی دستگاهی ثبت نشده — ابتدا از تب «خانواده‌های دستگاه» یکی بسازید.
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فعال</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending} fullWidth disabled={!formData.family_id}>
                {modalMode === 'create' ? 'ایجاد برند' : 'ذخیره تغییرات'}
              </Button>
              <Button variant="outline" onClick={closeModal} fullWidth>انصراف</Button>
            </div>
          </div>
        </Modal>
      )}

      {modalMode === 'view' && selectedBrand && (
        <Modal isOpen={true} onClose={closeModal} title="جزئیات برند دستگاه" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {selectedBrand.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedBrand.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedBrand.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">خانواده‌ی دستگاه</label>
                <div className="font-medium text-gray-900 dark:text-gray-100">{selectedBrand.family?.name || 'بدون خانواده'}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">وضعیت</label>
                <div>
                  <Badge variant={selectedBrand.is_active ? 'success' : 'error'}>
                    {selectedBrand.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={() => handleEdit(selectedBrand)} fullWidth>ویرایش</Button>
              <Button variant="outline" onClick={closeModal} fullWidth>بستن</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default AdminDeviceBrandsPage;
