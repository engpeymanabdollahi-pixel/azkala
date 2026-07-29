import { useState } from 'react';
import { Edit2, Trash2, Eye, Plus, Smartphone, Laptop, Tablet, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CrudTable, type ColumnDef, type FilterConfig, type ActionConfig } from '@/features/admin/components/CrudTable';
import {
  adminDeviceBrandService,
  type AdminDeviceBrand,
  type DeviceBrandFormData,
} from '@/services/api/adminDeviceBrand.service';
import { useCrudMutations } from '@/features/admin/hooks';

type ModalMode = 'create' | 'edit' | 'view';

const typeIcons: Record<string, any> = {
  mobile: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  accessory: Puzzle,
};

const typeLabels: Record<string, string> = {
  mobile: 'موبایل',
  laptop: 'لپ‌تاپ',
  tablet: 'تبلت',
  accessory: 'لوازم جانبی',
};

export function AdminDeviceBrandsPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<AdminDeviceBrand | null>(null);
  const [formData, setFormData] = useState<DeviceBrandFormData>({
    name: '',
    slug: '',
    type: 'mobile',
    is_active: true,
  });

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
    setFormData({ name: '', slug: '', type: 'mobile', is_active: true });
  };

  const handleEdit = (brand: AdminDeviceBrand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      type: brand.type,
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
      render: (value, brand) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold">
            {brand.name?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-900">{brand.name}</div>
            <div className="text-xs text-gray-500">{brand.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'نوع دستگاه',
      render: (value) => {
        const Icon = typeIcons[value] || Smartphone;
        return (
          <Badge variant="secondary" size="sm">
            <Icon className="w-3 h-3 ml-1" />
            {typeLabels[value] || value}
          </Badge>
        );
      },
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
      key: 'type',
      label: 'نوع دستگاه',
      type: 'select',
      options: [
        { label: 'موبایل', value: 'mobile' },
        { label: 'لپ‌تاپ', value: 'laptop' },
        { label: 'تبلت', value: 'tablet' },
        { label: 'لوازم جانبی', value: 'accessory' },
      ],
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
      variant: 'danger',
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
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع دستگاه</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
              >
                <option value="mobile">موبایل</option>
                <option value="laptop">لپ‌تاپ</option>
                <option value="tablet">تبلت</option>
                <option value="accessory">لوازم جانبی</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium">فعال</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending} fullWidth>
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
                <h3 className="text-xl font-bold">{selectedBrand.name}</h3>
                <p className="text-gray-500 text-sm">{selectedBrand.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">نوع دستگاه</label>
                <div className="font-medium">{typeLabels[selectedBrand.type] || selectedBrand.type}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">وضعیت</label>
                <div>
                  <Badge variant={selectedBrand.is_active ? 'success' : 'error'}>
                    {selectedBrand.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => handleEdit(selectedBrand)} fullWidth>ویرایش</Button>
              <Button variant="outline" onClick={closeModal} fullWidth>بستن</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}