import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CrudTable, type ColumnDef, type FilterConfig, type ActionConfig } from '@/features/admin/components/CrudTable';
import { adminDeviceModelService, type AdminDeviceModel, type DeviceModelFormData } from '@/services/api/adminDeviceModel.service';
import { adminDeviceBrandService } from '@/services/api/adminDeviceBrand.service';
import { useCrudMutations } from '@/features/admin/hooks';

type ModalMode = 'create' | 'edit';

export function AdminDeviceModelsPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedModel, setSelectedModel] = useState<AdminDeviceModel | null>(null);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [series, setSeries] = useState<{id: number, name: string, brand_id: number}[]>([]);
  
  const [formData, setFormData] = useState<DeviceModelFormData>({
    series_id: 0,
    name: '',
    slug: '',
    release_year: new Date().getFullYear(),
    is_active: true,
  });

  useEffect(() => {
    adminDeviceBrandService.getBrands({ per_page: 100 }).then(res => setBrands(res.data.brands));
  }, []);

  const loadSeries = async (brandId?: number) => {
    const res = await adminDeviceModelService.getSeriesDropdown(brandId);
    setSeries(res.data);
    if (res.data.length > 0 && !formData.series_id) {
      setFormData(prev => ({ ...prev, series_id: res.data[0].id }));
    }
  };

  useEffect(() => { loadSeries(); }, []);

  const { createMutation, updateMutation, deleteMutation } = useCrudMutations({
    queryKeys: ['admin/device-models'],
    successMessages: { create: 'مدل دستگاه ایجاد شد', update: 'مدل دستگاه به‌روزرسانی شد', delete: 'مدل دستگاه حذف شد' },
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedModel(null);
    setFormData({ series_id: series[0]?.id || 0, name: '', slug: '', release_year: new Date().getFullYear(), is_active: true });
  };

  const handleEdit = (model: AdminDeviceModel) => {
    setSelectedModel(model);
    setFormData({ series_id: model.series_id, name: model.name, slug: model.slug, release_year: model.release_year, is_active: model.is_active });
    setModalMode('edit');
  };

  const handleSubmit = () => {
    if (modalMode === 'create') {
      createMutation.mutate({ endpoint: '/admin/device-models', data: formData });
      closeModal();
    } else if (modalMode === 'edit' && selectedModel) {
      updateMutation.mutate({ endpoint: '/admin/device-models', id: selectedModel.id, data: formData });
      closeModal();
    }
  };

  const columns: ColumnDef<AdminDeviceModel>[] = [
    {
      key: 'name',
      label: 'نام مدل',
      render: (value, model) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900">{model.name}</div>
            <div className="text-xs text-gray-500">{model.slug}</div>
          </div>
        </div>
      ),
    },
    { key: 'brand_name', label: 'برند', render: (value) => <span className="font-medium text-gray-700">{value}</span> },
    { key: 'series_name', label: 'سری', render: (value) => <span className="text-gray-600">{value}</span> },
    { key: 'release_year', label: 'سال عرضه', render: (value) => <span className="text-gray-600">{value || '-'}</span> },
    {
      key: 'is_active', label: 'وضعیت',
      render: (value) => <Badge variant={value ? 'success' : 'error'} size="sm">{value ? 'فعال' : 'غیرفعال'}</Badge>,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'brand_id', label: 'برند', type: 'select',
      options: [{ label: 'همه', value: '' }, ...brands.map(b => ({ label: b.name, value: String(b.id) }))],
    },
    {
      key: 'is_active', label: 'وضعیت', type: 'select',
      options: [{ label: 'فعال', value: '1' }, { label: 'غیرفعال', value: '0' }],
    },
  ];

  const actions: ActionConfig<AdminDeviceModel>[] = [
    { label: 'ویرایش', icon: <Edit2 className="w-4 h-4" />, onClick: handleEdit, variant: 'ghost' },
    {
      label: 'حذف', icon: <Trash2 className="w-4 h-4" />, variant: 'danger',
      onClick: (model) => {
        if (confirm(`آیا از حذف مدل "${model.name}" مطمئن هستید؟`)) {
          deleteMutation.mutate({ endpoint: '/admin/device-models', id: model.id });
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <CrudTable
        endpoint="/admin/device-models"
        columns={columns} filters={filters} actions={actions}
        title="مدیریت مدل‌های دستگاه"
        onAdd={() => { loadSeries(); setModalMode('create'); }}
        addLabel="افزودن مدل جدید"
        dataKey="models"
      />

      {modalMode && (
        <Modal isOpen={true} onClose={closeModal} title={modalMode === 'create' ? 'افزودن مدل جدید' : 'ویرایش مدل'} size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">برند دستگاه</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 bg-gray-50"
                onChange={(e) => {
                  const bId = e.target.value ? Number(e.target.value) : undefined;
                  loadSeries(bId);
                }}
              >
                <option value="">انتخاب کنید (اختیاری برای فیلتر)</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سری دستگاه *</label>
              <select
                value={formData.series_id}
                onChange={(e) => setFormData({ ...formData, series_id: Number(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                required
              >
                {series.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <Input label="نام مدل" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="نامک (Slug)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generate" />
            <Input label="سال عرضه" type="number" value={formData.release_year} onChange={(e) => setFormData({ ...formData, release_year: Number(e.target.value) })} />
            
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