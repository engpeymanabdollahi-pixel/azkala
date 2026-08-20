import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Search, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { adminProductRelationshipService, type ProductRelationshipItem } from '@/services/api/productRelationship.service';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ✅ Marketplace Unification فاز A2/A3: صفحه‌ی مدیریت «محصولات مکمل» برای
// ادمین — روی همان API موجود از فاز Product Relationship (بدون تغییر
// منطق آن)، فقط UI که تا این فاز ساخته نشده بود. برخلاف فروشنده که به
// محصولات خودش محدود است، ادمین می‌تواند بین محصولات دو فروشنده‌ی متفاوت
// رابطه بسازد (Hybrid ownership) — همراه با هشدار صریح cross-seller.

interface AdminProductSummary {
  id: number;
  name: string;
  main_image: string | null;
  seller?: { id: number; name: string; shop_name: string } | null;
}

function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['admin-products-search-for-relationships', query],
    queryFn: async () => {
      const response = await apiClient.get('/admin/products', {
        params: { search: query, per_page: 10 },
      });
      return (response.data?.data?.products || []) as AdminProductSummary[];
    },
    enabled: query.trim().length >= 2,
  });
}

function ProductSearchPicker({
  placeholder,
  onSelect,
  excludeId,
}: {
  placeholder: string;
  onSelect: (product: AdminProductSummary) => void;
  excludeId?: number;
}) {
  const [query, setQuery] = useState('');
  const { data: results = [], isFetching } = useProductSearch(query);

  return (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
      />
      {query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
          {isFetching ? (
            <div className="p-3 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-500" /></div>
          ) : results.filter((p) => p.id !== excludeId).length > 0 ? (
            results.filter((p) => p.id !== excludeId).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p);
                  setQuery('');
                }}
                className="w-full flex items-center gap-2 p-2.5 text-right hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <SafeImage src={p.main_image || ''} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" fallbackEmoji="📦" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                  {p.seller && <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{p.seller.shop_name}</p>}
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-gray-400">محصولی یافت نشد</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProductRelationshipsPage() {
  const queryClient = useQueryClient();
  const [sourceProduct, setSourceProduct] = useState<AdminProductSummary | null>(null);
  const [pendingTarget, setPendingTarget] = useState<AdminProductSummary | null>(null);

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['admin-product-relationships', sourceProduct?.id],
    queryFn: async () => (await adminProductRelationshipService.list(sourceProduct!.id)).data,
    enabled: !!sourceProduct,
  });

  const createMutation = useMutation({
    mutationFn: (targetId: number) => adminProductRelationshipService.create(sourceProduct!.id, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-relationships', sourceProduct?.id] });
      toast.success('محصول مکمل اضافه شد', { icon: '✅' });
      setPendingTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در افزودن');
      setPendingTarget(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (relationshipId: number) => adminProductRelationshipService.remove(sourceProduct!.id, relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-relationships', sourceProduct?.id] });
      toast.success('حذف شد');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در حذف');
    },
  });

  // ✅ فاز A3: هشدار صریح قبل از ایجاد رابطه‌ی cross-seller.
  const handlePickTarget = (target: AdminProductSummary) => {
    if (sourceProduct?.seller && target.seller && sourceProduct.seller.id !== target.seller.id) {
      setPendingTarget(target);
      return;
    }
    createMutation.mutate(target.id);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">محصولات مکمل</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">مدیریت «همراه این محصول» — مستقل از سازگاری دستگاه و محصولات مشابه</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">۱. محصول مبدأ را انتخاب کنید</label>
        {sourceProduct ? (
          <div className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
            <SafeImage src={sourceProduct.main_image || ''} alt={sourceProduct.name} className="w-10 h-10 rounded-lg object-cover" fallbackEmoji="📦" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{sourceProduct.name}</p>
              {sourceProduct.seller && <p className="text-[10px] text-gray-500 dark:text-gray-400">{sourceProduct.seller.shop_name}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setSourceProduct(null)}>تغییر</Button>
          </div>
        ) : (
          <ProductSearchPicker placeholder="جستجوی محصول مبدأ..." onSelect={setSourceProduct} />
        )}
      </div>

      {sourceProduct && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">۲. محصولات مکمل فعلی</label>
            {relationships.length > 0 && <Badge variant="success" size="sm">{relationships.length} محصول</Badge>}
          </div>

          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" /></div>
          ) : relationships.length === 0 ? (
            <EmptyState
              icon={<Link2 className="w-10 h-10" />}
              title="هنوز محصول مکملی ثبت نشده"
              description="از جستجوی زیر یک محصول مقصد اضافه کنید"
            />
          ) : (
            <div className="space-y-2">
              {relationships.map((rel: ProductRelationshipItem) => (
                <div key={rel.id} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-lg p-2.5">
                  <SafeImage src={rel.target_product?.main_image || ''} alt={rel.target_product?.name || ''} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" fallbackEmoji="📦" />
                  <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {rel.target_product?.name || 'محصول حذف‌شده'}
                  </span>
                  <Badge variant="success" size="sm">فعال</Badge>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(rel.id)}
                    disabled={removeMutation.isPending}
                    className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">۳. افزودن محصول مکمل جدید</label>
            <ProductSearchPicker
              placeholder="جستجوی محصول مقصد (هر فروشنده‌ای)..."
              onSelect={handlePickTarget}
              excludeId={sourceProduct.id}
            />
          </div>
        </div>
      )}

      {/* ✅ فاز A3: Confirmation dialog برای رابطه‌ی cross-seller */}
      <Modal isOpen={!!pendingTarget} onClose={() => setPendingTarget(null)} title="رابطه‌ی بین دو فروشنده" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-800 dark:text-warning-300">
              این رابطه cross-seller است — محصول مقصد («{pendingTarget?.name}») متعلق به فروشنده‌ی دیگری است
              ({pendingTarget?.seller?.shop_name}) نه فروشنده‌ی محصول مبدأ ({sourceProduct?.seller?.shop_name}).
              آیا مطمئن هستید؟
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingTarget(null)}>انصراف</Button>
            <Button
              onClick={() => pendingTarget && createMutation.mutate(pendingTarget.id)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
              تأیید و افزودن
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
