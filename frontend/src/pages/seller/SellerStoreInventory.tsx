import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Package, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { storeService } from '@/services/api/store.service';
import { getSellerProducts } from '@/services/sellerProduct.service';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';

/**
 * مدیریت موجودی فیزیکی محصولات یک فروشگاه (Phase 15).
 *
 * ✅ فروشنده هرگز نمی‌تواند محصولی جز محصولات خودش را انتخاب کند — این
 * dropdown فقط از /seller/products (که همیشه scoped به فروشنده‌ی
 * لاگین‌شده است) پر می‌شود؛ enforcement واقعی هم در بک‌اند
 * (StoreInventoryService) دوباره چک می‌شود، این فقط UX است.
 */
export default function SellerStoreInventory() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(storeId);

  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [newStock, setNewStock] = useState(0);
  const [stockDraft, setStockDraft] = useState<Record<number, number>>({});

  const { data: store } = useQuery({
    queryKey: ['seller-stores', id],
    queryFn: () => storeService.get(id),
    enabled: !!id,
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['seller-store-inventory', id],
    queryFn: () => storeService.listInventory(id),
    enabled: !!id,
  });

  const { data: productsData } = useQuery({
    queryKey: ['seller-products-for-store', id],
    queryFn: () => getSellerProducts(1, 200),
    enabled: !!id,
  });

  const myProducts = productsData?.data ?? [];
  const inventoryProductIds = new Set(inventory.map((i) => i.product_id));
  const availableProducts = myProducts.filter((p) => !inventoryProductIds.has(p.id));

  const upsertMutation = useMutation({
    mutationFn: ({ productId, stock }: { productId: number; stock: number }) => storeService.upsertInventory(id, productId, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-store-inventory', id] });
      toast.success('موجودی به‌روزرسانی شد');
    },
    onError: () => toast.error('خطا در به‌روزرسانی موجودی'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => storeService.removeInventory(id, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-store-inventory', id] });
      toast.success('محصول از این فروشگاه حذف شد');
    },
    onError: () => toast.error('خطا در حذف'),
  });

  const handleAdd = () => {
    if (!selectedProductId) {
      toast.error('یک محصول انتخاب کنید');
      return;
    }
    upsertMutation.mutate({ productId: Number(selectedProductId), stock: newStock });
    setSelectedProductId('');
    setNewStock(0);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto font-sans">
      <button
        onClick={() => navigate('/seller/stores')}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-3"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به فروشگاه‌ها
      </button>

      <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 mb-1">
        <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        موجودی فیزیکی — {store?.name ?? '...'}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        این موجودی کاملاً مستقل از موجودی آنلاین محصول است و فقط برای نمایش در «فروشگاه‌های نزدیک شما» استفاده می‌شود.
      </p>

      {/* افزودن محصول جدید */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 mb-5">
        <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">افزودن محصول به این فروشگاه</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">انتخاب محصول از میان محصولات من...</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={newStock}
            onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
            placeholder="موجودی"
            className="w-full md:w-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          />
          <Button onClick={handleAdd} disabled={upsertMutation.isPending} leftIcon={<Plus className="w-4 h-4" />}>
            افزودن
          </Button>
        </div>
        {availableProducts.length === 0 && myProducts.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">همه‌ی محصولات شما در حال حاضر به این فروشگاه متصل هستند.</p>
        )}
      </div>

      {isLoading && <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />}

      {!isLoading && inventory.length === 0 && (
        <EmptyState
          icon={<Package className="w-10 h-10" />}
          title="هنوز محصولی به این فروشگاه اضافه نشده"
          description="از فرم بالا یکی از محصولات خودتان را انتخاب و موجودی آن در این فروشگاه را ثبت کنید."
        />
      )}

      <div className="space-y-2">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-3"
          >
            <SafeImage
              src={item.product?.main_image}
              alt={item.product?.name || ''}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              fallbackEmoji="📦"
            />
            <div className="flex-1 min-w-0">
              {item.product?.slug ? (
                <Link to={`/products/${item.product.slug}`} className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-primary-600 truncate block">
                  {item.product?.name}
                </Link>
              ) : (
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.product?.name}</p>
              )}
              {item.product?.price && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatPrice(item.product.price)}</p>
              )}
            </div>
            <input
              type="number"
              min={0}
              value={stockDraft[item.product_id] ?? item.stock}
              onChange={(e) => setStockDraft({ ...stockDraft, [item.product_id]: Math.max(0, Number(e.target.value)) })}
              className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                upsertMutation.mutate({ productId: item.product_id, stock: stockDraft[item.product_id] ?? item.stock })
              }
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              ذخیره
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeMutation.mutate(item.product_id)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              حذف
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
