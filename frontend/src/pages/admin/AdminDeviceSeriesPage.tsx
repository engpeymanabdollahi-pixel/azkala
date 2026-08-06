import { useState, useEffect } from 'react';
import { Edit2, Trash2, Eye, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { CrudTable, type ColumnDef, type FilterConfig, type ActionConfig } from '@/features/admin/components/CrudTable';
import { adminDeviceSeriesService, type AdminDeviceSeries, type DeviceSeriesFormData } from '@/services/api/adminDeviceSeries.service';
import { adminDeviceBrandService } from '@/services/api/adminDeviceBrand.service';
import { useCrudMutations } from '@/features/admin/hooks';

type ModalMode = 'create' | 'edit' | 'view';

export function AdminDeviceSeriesPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<AdminDeviceSeries | null>(null);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  
  const [formData, setFormData] = useState<DeviceSeriesFormData>({
    brand_id: 0,
    name: '',
    slug: '',
    is_active: true,
  });

  useEffect(() => {
    // دریافت لیست برندها برای دراپ‌داون
    adminDeviceBrandService.getBrands({ per_page: 100 }).then(res => {
      setBrands(res.data.brands);
      if (res.data.brands.length > 0 && !formData.brand_id) {
        setFormData(prev => ({ ...prev, brand_id: res.data.brands[0].id }));
      }
    });
  }, []);

  const { createMutation, updateMutation, deleteMutation } = useCrudMutations({
    queryKeys: ['admin/device-series'],
    successMessages: { create: 'سری دستگاه ایجاد شد', update: 'سری دستگاه به‌روزرسانی شد', delete: 'سری دستگاه حذف شد' },
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedSeries(null);
    setFormData({ brand_id: brands[0]?.id || 0, name: '', slug: '', is_active: true });
  };

  const handleEdit = (series: AdminDeviceSeries) => {
    setSelectedSeries(series);
    setFormData({ brand_id: series.brand_id, name: series.name, slug: series.slug, is_active: series.is_active });
    setModalMode('edit');
  };

  const handleSubmit = () => {
    if (modalMode === 'create') {
      createMutation.mutate({ endpoint: '/admin/device-series', data: formData });
      closeModal();
    } else if (modalMode === 'edit' && selectedSeries) {
      updateMutation.mutate({ endpoint: '/admin/device-series', id: selectedSeries.id, data: formData });
      closeModal();
    }
  };

  const columns: ColumnDef<AdminDeviceSeries>[] = [
    {
      key: 'name',
      label: 'نام سری',
      render: (value, series) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900">{series.name}</div>
            <div className="text-xs text-gray-500">{series.slug}</div>
          </div>
        </div>
      ),
    },
    { key: 'brand_name', label: 'برند', render: (value) => <span className="font-medium text-gray-700">{value}</span> },
    {
      key: 'is_active', label: 'وضعیت',
      render: (value) => <Badge variant={value ? 'success' : 'error'} size="sm">{value ? 'فعال' : 'غیرفعال'}</Badge>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'brand_id', label: 'برند', type: 'select',
      options: brands.map(b => ({ label: b.name, value: String(b.id) })),
    },
    {
      key: 'is_active', label: 'وضعیت', type: 'select',
      options: [{ label: 'فعال', value: '1' }, { label: 'غیرفعال', value: '0' }],
    },
  ];

  const actions: ActionConfig<AdminDeviceSeries>[] = [
    { label: 'ویرایش', icon: <Edit2 className="w-4 h-4" />, onClick: handleEdit, variant: 'ghost' },
    {
      label: 'حذف', icon: <Trash2 className="w-4 h-4" />, variant: 'danger',
      onClick: (series) => {
        if (confirm(`آیا از حذف سری "${series.name}" مطمئن هستید؟`)) {
          deleteMutation.mutate({ endpoint: '/admin/device-series', id: series.id });
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <CrudTable
        endpoint="/admin/device-series"
        columns={columns} filters={filters} actions={actions}
        title="مدیریت سری‌های دستگاه"
        onAdd={() => setModalMode('create')}
        addLabel="افزودن سری جدید"
        dataKey="series"
      />

      {modalMode && modalMode !== 'view' && (
        <Modal isOpen={true} onClose={closeModal} title={modalMode === 'create' ? 'افزودن سری جدید' : 'ویرایش سری'} size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">برند دستگاه *</label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: Number(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                required
              >
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <Input label="نام سری" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="نامک (Slug)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generate" />
            
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm font-medium">فعال</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending} fullWidth>
                {modalMode === 'create' ? 'ایجاد' : 'ذخیره تغییرات'}
              </Button>
              <Button variant="outline" onClick={closeModal} fullWidth>انصراف</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default AdminDeviceSeriesPage;
