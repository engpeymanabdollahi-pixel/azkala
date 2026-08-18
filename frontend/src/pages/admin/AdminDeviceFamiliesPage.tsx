import { useState } from 'react';
import { Edit2, Trash2, Eye, Watch } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CrudTable, type ColumnDef, type FilterConfig, type ActionConfig } from '@/features/admin/components/CrudTable';
import {
  type AdminDeviceFamily,
  type DeviceFamilyFormData,
} from '@/services/api/adminDeviceFamily.service';
import { useCrudMutations } from '@/features/admin/hooks';

type ModalMode = 'create' | 'edit' | 'view';

/**
 * ✅ Device-First Architecture فاز ۱E: مدیریت خانواده‌های دستگاه
 * (Smartphone/Laptop/Tablet/...). این صفحه تنها UI ادمین برای «اکوسیستم
 * دستگاه» است — افزودن یک خانواده‌ی جدید (مثلاً Smartwatch) از همین‌جا،
 * بدون هیچ تغییر کدی، در انتخابگر دستگاه سایت و فرم برند دستگاه ظاهر
 * می‌شود.
 */
export function AdminDeviceFamiliesPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<AdminDeviceFamily | null>(null);
  const [formData, setFormData] = useState<DeviceFamilyFormData>({
    name: '',
    slug: '',
    icon: '',
    is_active: true,
  });

  const { createMutation, updateMutation, deleteMutation } = useCrudMutations({
    queryKeys: ['admin/device-families'],
    successMessages: {
      create: 'خانواده‌ی دستگاه با موفقیت ایجاد شد',
      update: 'خانواده‌ی دستگاه با موفقیت به‌روزرسانی شد',
      delete: 'خانواده‌ی دستگاه با موفقیت حذف شد',
    },
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedFamily(null);
    setFormData({ name: '', slug: '', icon: '', is_active: true });
  };

  const handleEdit = (family: AdminDeviceFamily) => {
    setSelectedFamily(family);
    setFormData({
      name: family.name,
      slug: family.slug,
      description: family.description || '',
      icon: family.icon || '',
      sort_order: family.sort_order,
      is_active: family.is_active,
    });
    setModalMode('edit');
  };

  const handleView = (family: AdminDeviceFamily) => {
    setSelectedFamily(family);
    setModalMode('view');
  };

  const handleCreate = () => setModalMode('create');

  const handleSubmit = () => {
    if (modalMode === 'create') {
      createMutation.mutate({ endpoint: '/admin/device-families', data: formData });
      closeModal();
    } else if (modalMode === 'edit' && selectedFamily) {
      updateMutation.mutate({ endpoint: '/admin/device-families', id: selectedFamily.id, data: formData });
      closeModal();
    }
  };

  const columns: ColumnDef<AdminDeviceFamily>[] = [
    {
      key: 'name',
      label: 'نام خانواده',
      sortable: true,
      render: (_value, family) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-gray-100">{family.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{family.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'brands_count',
      label: 'تعداد برندها',
      render: (value) => <span className="text-gray-700 dark:text-gray-300">{value ?? 0}</span>,
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
      key: 'is_active',
      label: 'وضعیت',
      type: 'select',
      options: [
        { label: 'فعال', value: '1' },
        { label: 'غیرفعال', value: '0' },
      ],
    },
  ];

  const actions: ActionConfig<AdminDeviceFamily>[] = [
    { label: 'مشاهده', icon: <Eye className="w-4 h-4" />, onClick: handleView, variant: 'ghost' },
    { label: 'ویرایش', icon: <Edit2 className="w-4 h-4" />, onClick: handleEdit, variant: 'ghost' },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (family) => {
        if (confirm(`آیا از حذف خانواده‌ی دستگاه "${family.name}" مطمئن هستید؟ (اگر برندی به آن وصل باشد، حذف رد می‌شود — به‌جایش غیرفعالش کنید.)`)) {
          deleteMutation.mutate({ endpoint: '/admin/device-families', id: family.id });
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 text-sm text-primary-800 dark:text-primary-300">
        خانواده‌ی دستگاه، مرز درجه‌یکِ اکوسیستم است (Smartphone، Laptop، Tablet و هر اکوسیستم آینده مثل Smartwatch یا Camera). غیرفعال کردن یک خانواده، تمام برند/سری/مدل‌های زیرمجموعه‌اش را در صفحات عمومی و فرم فروشندگان پنهان می‌کند — بدون حذف داده.
      </div>

      <CrudTable
        endpoint="/admin/device-families"
        columns={columns}
        filters={filters}
        actions={actions}
        title="مدیریت خانواده‌های دستگاه"
        enableSelection={false}
        onAdd={handleCreate}
        addLabel="افزودن خانواده‌ی دستگاه جدید"
        dataKey="families"
      />

      {modalMode && modalMode !== 'view' && (
        <Modal isOpen={true} onClose={closeModal} title={modalMode === 'create' ? 'افزودن خانواده‌ی دستگاه جدید' : 'ویرایش خانواده‌ی دستگاه'} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="نام (مثلاً Smartwatch)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="نامک (Slug)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generate" />
            </div>
            <Input label="توضیحات (اختیاری)" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <Input label="آیکون (اختیاری، نام lucide-react)" value={formData.icon || ''} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="watch" />

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فعال</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending} fullWidth>
                {modalMode === 'create' ? 'ایجاد خانواده' : 'ذخیره تغییرات'}
              </Button>
              <Button variant="outline" onClick={closeModal} fullWidth>انصراف</Button>
            </div>
          </div>
        </Modal>
      )}

      {modalMode === 'view' && selectedFamily && (
        <Modal isOpen={true} onClose={closeModal} title="جزئیات خانواده‌ی دستگاه" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white">
                <Watch className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedFamily.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedFamily.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">تعداد برندها</label>
                <div className="font-medium text-gray-900 dark:text-gray-100">{selectedFamily.brands_count ?? 0}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">وضعیت</label>
                <div>
                  <Badge variant={selectedFamily.is_active ? 'success' : 'error'}>
                    {selectedFamily.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button onClick={() => handleEdit(selectedFamily)} fullWidth>ویرایش</Button>
              <Button variant="outline" onClick={closeModal} fullWidth>بستن</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminDeviceFamiliesPage;
