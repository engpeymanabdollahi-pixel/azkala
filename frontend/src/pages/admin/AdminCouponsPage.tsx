import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, X, CheckCircle,
  Tag, Percent, DollarSign, Calendar, Users, Package,
  Search, ArrowLeft, ToggleLeft, ToggleRight, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { couponService, type Coupon } from '@/services/api/coupon.service';
import { useCrudMutations } from '@/features/admin/hooks';
import { formatPrice } from '@/utils/format';
import toast from 'react-hot-toast';

interface CouponFormData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_limit_per_user: number;
  start_date: string;
  end_date: string;
  description: string;
  is_active: boolean;
}

const emptyForm: CouponFormData = {
  code: '',
  type: 'percentage',
  value: 0,
  min_order_amount: 0,
  max_discount: null,
  usage_limit: null,
  usage_limit_per_user: 1,
  start_date: '',
  end_date: '',
  description: '',
  is_active: true,
};

export function AdminCouponsPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'fixed'>('all');

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponService.getAllCoupons(),
  });

  const coupons: Coupon[] = couponsData?.data?.data || [];

  const { createMutation, updateMutation, deleteMutation, customMutation } = useCrudMutations({
    queryKeys: ['admin-coupons'],
    successMessages: {
      create: 'کد تخفیف ایجاد شد',
      update: 'کد تخفیف به‌روزرسانی شد',
      delete: 'کد تخفیف حذف شد',
    },
  });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount: coupon.max_discount || null,
      usage_limit: coupon.usage_limit || null,
      usage_limit_per_user: coupon.usage_limit_per_user || 1,
      start_date: coupon.start_date ? coupon.start_date.split(' ')[0] : '',
      end_date: coupon.end_date ? coupon.end_date.split(' ')[0] : '',
      description: coupon.description || '',
      is_active: coupon.is_active !== false,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCoupon(null);
    setFormData(emptyForm);
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast.error('کد تخفیف الزامی است');
      return;
    }
    if (formData.value <= 0) {
      toast.error('مقدار تخفیف باید بیشتر از صفر باشد');
      return;
    }

    const submitData: any = {
      ...formData,
      max_discount: formData.type === 'percentage' ? formData.max_discount : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editingCoupon) {
      updateMutation.mutate({
        endpoint: '/admin/coupons',
        id: editingCoupon.id,
        data: submitData,
      });
    } else {
      createMutation.mutate({
        endpoint: '/admin/coupons',
        data: submitData,
      });
    }
    handleCloseForm();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('آیا از حذف این کد تخفیف مطمئن هستید؟')) {
      deleteMutation.mutate({
        endpoint: '/admin/coupons',
        id,
      });
    }
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    customMutation.mutate({
      endpoint: '/admin/coupons',
      method: 'PUT',
      id,
      data: { is_active: !currentStatus },
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('کد کپی شد', { icon: '📋' });
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      if (searchQuery && !coupon.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterStatus === 'active' && !coupon.is_active) return false;
      if (filterStatus === 'inactive' && coupon.is_active) return false;
      if (filterType !== 'all' && coupon.type !== filterType) return false;
      return true;
    });
  }, [coupons, searchQuery, filterStatus, filterType]);

  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    percentage: coupons.filter(c => c.type === 'percentage').length,
    fixed: coupons.filter(c => c.type === 'fixed').length,
    totalUsage: coupons.reduce((sum, c) => sum + (c.used_count || 0), 0),
  }), [coupons]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-white rounded-xl mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                مدیریت کدهای تخفیف
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ایجاد، ویرایش و مدیریت کدهای تخفیف فروشگاه
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            کد تخفیف جدید
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard icon={Package} label="کل کدها" value={stats.total} color="primary" />
          <StatCard icon={CheckCircle} label="فعال" value={stats.active} color="success" />
          <StatCard icon={Percent} label="درصدی" value={stats.percentage} color="accent" />
          <StatCard icon={DollarSign} label="مبلغ ثابت" value={stats.fixed} color="warning" />
          <StatCard icon={Users} label="کل استفاده" value={stats.totalUsage} color="primary" />
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="جستجوی کد تخفیف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
              >
                <option value="all">همه انواع</option>
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredCoupons.length === 0 ? (
            <EmptyState
              icon={<Tag className="w-12 h-12" />}
              title="کد تخفیفی یافت نشد"
              description={searchQuery ? 'نتیجه‌ای برای جستجوی شما یافت نشد' : 'هنوز کد تخفیفی ایجاد نکرده‌اید'}
              action={!searchQuery && (
                <Button onClick={handleOpenCreate} size="md">
                  <Plus className="w-4 h-4 ml-1.5" />
                  ایجاد کد تخفیف
                </Button>
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">کد</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">نوع</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">مقدار</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">حداقل سفارش</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">استفاده</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">اعتبار</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-600">وضعیت</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-600">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs font-bold">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="کپی کد"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={coupon.type === 'percentage' ? 'accent' : 'warning'} size="sm" className="gap-1">
                          {coupon.type === 'percentage' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                          {coupon.type === 'percentage' ? 'درصدی' : 'مبلغ ثابت'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">
                          {coupon.type === 'percentage' ? `${coupon.value}٪` : formatPrice(coupon.value)}
                        </span>
                        {coupon.max_discount && coupon.type === 'percentage' && (
                          <p className="text-[10px] text-gray-500">حداکثر {formatPrice(coupon.max_discount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {coupon.min_order_amount > 0 ? formatPrice(coupon.min_order_amount) : 'بدون محدودیت'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">{coupon.used_count || 0}</span>
                          {coupon.usage_limit && <span className="text-[10px] text-gray-500">/ {coupon.usage_limit}</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">هر کاربر: {coupon.usage_limit_per_user}x</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          {coupon.start_date && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              شروع: {new Date(coupon.start_date).toLocaleDateString('fa-IR')}
                            </p>
                          )}
                          {coupon.end_date && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              پایان: {new Date(coupon.end_date).toLocaleDateString('fa-IR')}
                            </p>
                          )}
                          {!coupon.start_date && !coupon.end_date && <span className="text-gray-400">نامحدود</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(coupon.id, coupon.is_active !== false)}
                          className="flex items-center gap-1.5"
                        >
                          {coupon.is_active !== false ? (
                            <>
                              <ToggleRight className="w-6 h-6 text-success-500" />
                              <Badge variant="success" size="sm">فعال</Badge>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-6 h-6 text-gray-400" />
                              <Badge variant="gray" size="sm">غیرفعال</Badge>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(coupon)} className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-600 transition-colors" title="ویرایش">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(coupon.id)} className="p-1.5 hover:bg-error-50 rounded-lg text-gray-500 hover:text-error-600 transition-colors" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredCoupons.length > 0 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              نمایش {filteredCoupons.length} کد از {coupons.length} کد
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-600" />
                {editingCoupon ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف جدید'}
              </h3>
              <button onClick={handleCloseForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    کد تخفیف <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="مثلاً: SALE20"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 font-mono"
                    disabled={!!editingCoupon}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    نوع تخفیف <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="percentage">درصدی (٪)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    مقدار تخفیف <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    placeholder={formData.type === 'percentage' ? '10' : '50000'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                    min="0"
                  />
                </div>
                {formData.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">حداکثر مبلغ تخفیف</label>
                    <input
                      type="number"
                      value={formData.max_discount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_discount: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="100000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">حداقل مبلغ سفارش</label>
                  <input
                    type="number"
                    value={formData.min_order_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: e.target.value ? parseFloat(e.target.value) : 0 }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">محدودیت هر کاربر</label>
                  <input
                    type="number"
                    value={formData.usage_limit_per_user}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_limit_per_user: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">محدودیت کلی استفاده</label>
                <input
                  type="number"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="خالی = بدون محدودیت"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">تاریخ شروع</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">تاریخ پایان</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات کوتاه درباره این کد تخفیف..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">وضعیت فعال</p>
                  <p className="text-[10px] text-gray-500">در صورت غیرفعال بودن کد قابل استفاده نخواهد بود</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                >
                  {formData.is_active ? (
                    <ToggleRight className="w-10 h-10 text-success-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
              <Button variant="outline" onClick={handleCloseForm} disabled={createMutation.isPending || updateMutation.isPending}>
                انصراف
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                isLoading={createMutation.isPending || updateMutation.isPending}
                className="gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {editingCoupon ? 'به‌روزرسانی' : 'ایجاد کد تخفیف'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: number;
  color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
}) {
  const colors = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    error: 'text-error-600 bg-error-50',
    warning: 'text-warning-600 bg-warning-50',
    accent: 'text-accent-600 bg-accent-50',
    gray: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value.toLocaleString('fa-IR')}</p>
    </div>
  );
}
export default AdminCouponsPage;
