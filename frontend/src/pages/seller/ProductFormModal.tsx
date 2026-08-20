import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Package, DollarSign, Tag, Smartphone, CheckCircle,
  Loader2, Save, FileText, Image as ImageIcon, Plus, Trash2, ArrowLeft, Search, Edit, Palette, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useCreateProduct, useUpdateProduct } from '@/hooks/api/useSellerProducts';
import { categoryService } from '@/services/api/category.service';
import { deviceService } from '@/services/api/device.service';
import { sellerProductRelationshipService } from '@/services/api/productRelationship.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/client';

// ==================== Types ====================
interface FormData {
  name: string;
  slug: string;
  price: number;
  discount_price: number;
  stock: number;
  category_id: number;
  description: string;
  short_description: string;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
}

type FormFieldValue = FormData[keyof FormData];

interface FormErrors { [key: string]: string; }
interface Specification { key: string; value: string; }

// ✅ Variant/Color System فاز ۲.۲: هر ردیف یک رنگ مستقل با قیمت/موجودی/
// SKU خودش است. id فقط در حالت ویرایش (رنگ از قبل موجود) پر می‌شود؛
// نبودش یعنی رنگ تازه است و بک‌اند آن را create می‌کند.
interface VariantFormItem {
  id?: number;
  color_name: string;
  color_code: string;
  sku: string;
  price: number | '';
  compare_price: number | '';
  stock: number | '';
}

const EMPTY_VARIANT: VariantFormItem = {
  color_name: '', color_code: '', sku: '', price: '', compare_price: '', stock: '',
};

type Step = 'basic' | 'pricing' | 'variants' | 'specs' | 'models' | 'relationships';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  productId?: number | null;
  onSuccess?: () => void;
}

// ==================== Validation ====================
const validateField = (name: string, value: FormFieldValue): string => {
  switch (name) {
    case 'name': return !value ? 'نام محصول الزامی است' : String(value).length < 3 ? 'نام محصول باید حداقل ۳ کاراکتر باشد' : '';
    case 'price': return !value || (value as number) <= 0 ? 'قیمت باید بزرگتر از صفر باشد' : '';
    case 'stock': return (value === '' || value === null || value === undefined) ? 'موجودی الزامی است' : (value as number) < 0 ? 'موجودی نمی‌تواند منفی باشد' : '';
    case 'category_id': return !value ? 'دسته‌بندی را انتخاب کنید' : '';
    case 'description': return !value ? 'توضیحات محصول الزامی است' : String(value).length < 10 ? 'توضیحات باید حداقل ۱۰ کاراکتر باشد' : '';
    default: return '';
  }
};

// ==================== Main Component ====================
export function ProductFormModal({ isOpen, onClose, mode = 'create', productId = null, onSuccess }: ProductFormModalProps) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(productId || 0);

  const [formData, setFormData] = useState<FormData>({
    name: '', slug: '', price: 0, discount_price: 0, stock: 0,
    category_id: 0, description: '', short_description: '', sku: '',
    is_active: true, is_featured: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<string[]>([]);
  // ✅ استفاده از آرایه ID برای سادگی و هماهنگی مستقیم با API
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  // ✅ Variant/Color System فاز ۲.۲
  const [variants, setVariants] = useState<VariantFormItem[]>([]);
  const [activeStep, setActiveStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [relationshipSearch, setRelationshipSearch] = useState('');

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await categoryService.getAll()).data || [],
    enabled: isOpen,
  });

  // 2. Fetch Device Models (Unified Hierarchy)
  const { data: allDeviceModels = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['device-hierarchy'],
    queryFn: async () => {
      const models = await deviceService.getHierarchy();
      return models;
    },
    enabled: isOpen,
  });

  // 3. Fetch Product Data (Only in Edit Mode)
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await apiClient.get(`/seller/products/${productId}`);
      return response.data.data;
    },
    enabled: isOpen && mode === 'edit' && !!productId,
  });

  // ✅ Marketplace Unification فاز A1: «محصولات مکمل» — لیستِ رابطه‌های
  // موجودِ همین محصول + لیستِ محصولاتِ خودِ فروشنده (برای انتخابِ محصول
  // مقصد؛ بک‌اند هم مالکیتِ هر دو طرف را مستقل اجباری می‌کند، این فقط UX
  // را بهبود می‌دهد تا فروشنده اصلاً محصول فروشنده‌ی دیگری را نبیند).
  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['seller-product-relationships', productId],
    queryFn: async () => (await sellerProductRelationshipService.list(productId as number)).data,
    enabled: isOpen && mode === 'edit' && !!productId,
  });

  const { data: sellerProducts = [] } = useQuery({
    queryKey: ['seller-products-for-relationships'],
    queryFn: async () => {
      const response = await apiClient.get('/seller/products', { params: { per_page: 100 } });
      return (response.data?.data?.data || []) as { id: number; name: string; main_image: string | null }[];
    },
    enabled: isOpen && mode === 'edit' && activeStep === 'relationships',
  });

  const addRelationshipMutation = useMutation({
    mutationFn: (targetProductId: number) =>
      sellerProductRelationshipService.create(productId as number, targetProductId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product-relationships', productId] });
      toast.success('محصول مکمل اضافه شد', { icon: '✅' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در افزودن محصول مکمل');
    },
  });

  const removeRelationshipMutation = useMutation({
    mutationFn: (relationshipId: number) =>
      sellerProductRelationshipService.remove(productId as number, relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product-relationships', productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در حذف');
    },
  });

  // ✅ پر کردن فرم هنگام ورود به حالت ویرایش
  useEffect(() => {
    if (mode === 'edit' && productData) {
      setFormData({
        name: productData.name || '',
        slug: productData.slug || '',
        price: parseFloat(productData.price) || 0,
        discount_price: parseFloat(productData.discount_price) || 0,
        stock: productData.stock || 0,
        category_id: productData.category_id || 0,
        description: productData.description || '',
        short_description: productData.short_description || '',
        sku: productData.sku || '',
        is_active: productData.is_active ?? true,
        is_featured: productData.is_featured ?? false,
      });

      const productImages: string[] = [];
      if (productData.main_image) productImages.push(productData.main_image);
      if (productData.gallery && Array.isArray(productData.gallery)) {
        productImages.push(...productData.gallery);
      }
      setImages(productImages);

      // ✅ رفع باگ حیاتی: پر کردن مدل‌های انتخاب‌شده قبلی
      if (productData.deviceModels && Array.isArray(productData.deviceModels)) {
        setSelectedModelIds(productData.deviceModels.map((m: { id: number }) => m.id));
      }

      // مشخصات فنی قبلاً اینجا خوانده نمی‌شد — یعنی محصولی که قبلاً مشخصات
      // داشت، با ورود به فرم ویرایش خالی نشان داده می‌شد، و ذخیره‌ی دوباره
      // (بدون این‌که فروشنده متوجه شود) همان مشخصات را از بین می‌برد.
      if (productData.specifications && typeof productData.specifications === 'object') {
        setSpecifications(
          Object.entries(productData.specifications as Record<string, string>).map(([key, value]) => ({ key, value }))
        );
      } else {
        setSpecifications([]);
      }

      // ✅ Variant/Color System فاز ۲.۲: رنگ‌های موجود محصول را از پاسخ
      // GET /seller/products/{id} (که SellerService::getSellerProductDetail
      // با variants eager-load می‌کند) در state فرم پر می‌کند. id هر رنگ
      // نگه داشته می‌شود تا submit بعدی بداند این رنگ را update کند، نه
      // یک رنگ تازه بسازد.
      if (productData.variants && Array.isArray(productData.variants)) {
        setVariants(
          productData.variants.map((v: {
            id: number; color_name: string | null; color_code: string | null;
            sku: string | null; price: number | string | null;
            compare_price: number | string | null; stock: number | string | null;
          }) => ({
            id: v.id,
            color_name: v.color_name || '',
            color_code: v.color_code || '',
            sku: v.sku || '',
            price: v.price !== null && v.price !== undefined ? Number(v.price) : '',
            compare_price: v.compare_price !== null && v.compare_price !== undefined ? Number(v.compare_price) : '',
            stock: v.stock !== null && v.stock !== undefined ? Number(v.stock) : '',
          }))
        );
      } else {
        setVariants([]);
      }
    } else if (mode === 'create') {
      // ریست کردن فرم برای ساخت جدید
      setFormData({ name: '', slug: '', price: 0, discount_price: 0, stock: 0, category_id: 0, description: '', short_description: '', sku: '', is_active: true, is_featured: false });
      setImages([]);
      setSelectedModelIds([]);
      setSpecifications([]);
      setVariants([]);
      setActiveStep('basic');
    }
  }, [mode, productData, isOpen]);

  // Filter models
  const filteredModels = useMemo(() => {
    let models = allDeviceModels;
    if (selectedBrandFilter !== 'all') {
      models = models.filter((m: { brand?: { name: string } }) => m.brand?.name === selectedBrandFilter);
    }
    if (modelSearch.trim()) {
      const search = modelSearch.toLowerCase();
      models = models.filter((m: { name: string; brand?: { name: string } }) =>
        m.name.toLowerCase().includes(search) || m.brand?.name.toLowerCase().includes(search)
      );
    }
    return models;
  }, [allDeviceModels, selectedBrandFilter, modelSearch]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(allDeviceModels.map((m: { brand?: { name: string } }) => m.brand?.name).filter(Boolean))) as string[];
  }, [allDeviceModels]);

  const generateSlug = useCallback((name: string) => {
    return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }, []);

  const handleFieldChange = useCallback((field: keyof FormData, value: FormFieldValue) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'name') newData.slug = generateSlug(String(value));
      return newData;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors, generateSlug]);

  const toggleModel = useCallback((modelId: number) => {
    setSelectedModelIds(prev =>
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  }, []);

  // ✅ Variant/Color System فاز ۲.۲
  const addVariantRow = useCallback(() => {
    setVariants(prev => [...prev, { ...EMPTY_VARIANT }]);
  }, []);

  const updateVariantField = useCallback((index: number, field: keyof VariantFormItem, value: string | number) => {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }, []);

  const removeVariantRow = useCallback((index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ✅ Submit Handler یکپارچه
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }
    if (images.length === 0) {
      toast.error('حداقل یک تصویر الزامی است');
      return;
    }

    setIsSubmitting(true);

    // ✅ پیلود یکسان برای هر دو حالت ساخت و ویرایش
    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      short_description: formData.short_description?.trim() || undefined,
      price: Number(formData.price),
      discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
      stock: Number(formData.stock),
      category_id: Number(formData.category_id),
      sku: formData.sku?.trim() || undefined,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      main_image: images[0],
      gallery: images.length > 1 ? images.slice(1) : undefined,
      // ✅ ارسال حیاتی device_model_ids به بک‌اند
      device_model_ids: selectedModelIds,
      // مشخصات فنی — قبلاً اینجا اصلاً ارسال نمی‌شد؛ قدم «مشخصات» فرم هیچ
      // اثری روی محصول ذخیره‌شده نداشت. فقط ردیف‌های با کلید غیرخالی.
      specifications: specifications.length > 0
        ? specifications.reduce<Record<string, string>>((acc, spec) => {
            if (spec.key.trim()) acc[spec.key.trim()] = spec.value.trim();
            return acc;
          }, {})
        : undefined,

      // ✅ Variant/Color System فاز ۲.۲: همیشه ارسال می‌شود (حتی []) —
      // چون بک‌اند (SellerService::updateProduct) دقیقاً بر اساس حضورِ
      // این کلید تصمیم می‌گیرد که رنگ‌ها را sync کند یا دست‌نخورده
      // بگذارد؛ چون state این فرم همیشه با داده‌ی واقعی سرور شروع
      // می‌شود (یا خالی، در حالت ساخت)، ارسال بی‌قید‌وشرط دقیقاً همان
      // «وضعیت فعلی مطلوب» را نشان می‌دهد — نه بیشتر نه کمتر. ردیف‌های
      // کاملاً خالی (دکمه‌ی «افزودن رنگ» زده شده ولی چیزی وارد نشده)
      // نادیده گرفته می‌شوند.
      variants: variants
        .filter(v => v.color_name.trim() || v.sku.trim() || v.price !== '' || v.stock !== '')
        .map(v => ({
          ...(v.id ? { id: v.id } : {}),
          color_name: v.color_name.trim() || undefined,
          color_code: v.color_code.trim() || undefined,
          sku: v.sku.trim() || undefined,
          price: v.price === '' ? undefined : Number(v.price),
          compare_price: v.compare_price === '' ? undefined : Number(v.compare_price),
          stock: v.stock === '' ? 0 : Number(v.stock),
        })),
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('محصول با موفقیت ثبت شد', { icon: '✅' });
      } else {
        await updateMutation.mutateAsync(payload);
        toast.success('محصول با موفقیت به‌روزرسانی شد', { icon: '✅' });
      }

      if (onSuccess) onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error('خطا در ثبت/ویرایش محصول:', error);
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message || 'خطا در عملیات', { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, images, selectedModelIds, specifications, variants, validateForm, mode, createMutation, updateMutation, onSuccess, handleClose]);

  const steps = [
    { id: 'basic', label: mode === 'create' ? 'پایه' : 'اطلاعات پایه', icon: FileText },
    { id: 'pricing', label: 'قیمت و موجودی', icon: DollarSign },
    { id: 'variants', label: 'رنگ‌ها', icon: Palette },
    { id: 'specs', label: 'مشخصات', icon: Tag },
    { id: 'models', label: 'سازگاری', icon: Smartphone },
    // ✅ Marketplace Unification فاز A1: «محصولات مکمل» فقط در حالت ویرایش
    // معنا دارد — رابطه به وجود productId نیاز دارد که در حالت ساخت هنوز
    // موجود نیست.
    ...(mode === 'edit' ? [{ id: 'relationships' as const, label: 'محصولات مکمل', icon: Link2 }] : []),
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  if (!isOpen) return null;

  if (mode === 'edit' && isLoadingProduct) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">در حال بارگذاری اطلاعات محصول...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" onClick={handleClose} />
      <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center animate-scale-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                {mode === 'create' ? <Package className="w-5 h-5 text-white" /> : <Edit className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  {mode === 'create' ? 'افزودن محصول جدید' : 'ویرایش محصول'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{mode === 'edit' ? formData.name : 'اطلاعات محصول را وارد کنید'}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all hover:rotate-90">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const isPast = currentStepIndex > idx;
                return (
                  <div key={step.id} className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveStep(step.id as Step)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1',
                        isActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' :
                        isPast ? 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                      )}
                    >
                      {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                    {idx < steps.length - 1 && <div className={cn('w-4 h-0.5 flex-shrink-0', isPast ? 'bg-success-500' : 'bg-gray-200 dark:bg-slate-700')} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              <div className="lg:col-span-2 space-y-6">

                {/* Step: Basic */}
                {activeStep === 'basic' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نام محصول <span className="text-error-500">*</span></label>
                      <input type="text" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" placeholder="نام محصول" />
                      {errors.name && <p className="text-error-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">دسته‌بندی <span className="text-error-500">*</span></label>
                      <select value={formData.category_id} onChange={(e) => handleFieldChange('category_id', Number(e.target.value))} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500">
                        <option value={0}>انتخاب کنید</option>
                        {categories.map((cat: { id: number; name: string }) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                      {errors.category_id && <p className="text-error-500 text-xs mt-1">{errors.category_id}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">توضیحات <span className="text-error-500">*</span></label>
                      <textarea value={formData.description} onChange={(e) => handleFieldChange('description', e.target.value)} rows={4} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 resize-none" placeholder="توضیحات کامل محصول..." />
                      {errors.description && <p className="text-error-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setActiveStep('pricing')}>مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                    </div>
                  </div>
                )}

                {/* Step: Pricing */}
                {activeStep === 'pricing' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">قیمت (تومان) *</label>
                        <input type="number" value={formData.price || ''} onChange={(e) => handleFieldChange('price', Number(e.target.value))} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 font-mono" dir="ltr" />
                        {errors.price && <p className="text-error-500 text-xs mt-1">{errors.price}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">قیمت با تخفیف</label>
                        <input type="number" value={formData.discount_price || ''} onChange={(e) => handleFieldChange('discount_price', Number(e.target.value))} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 font-mono" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">موجودی *</label>
                      <input type="number" value={formData.stock || ''} onChange={(e) => handleFieldChange('stock', Number(e.target.value))} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 font-mono" dir="ltr" />
                      {errors.stock && <p className="text-error-500 text-xs mt-1">{errors.stock}</p>}
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('basic')}><ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل</Button>
                      <Button onClick={() => setActiveStep('variants')}>مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                    </div>
                  </div>
                )}

                {/* ✅ Variant/Color System فاز ۲.۲ — Step: رنگ‌ها */}
                {activeStep === 'variants' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">رنگ‌ها</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          اختیاری — اگر محصول در چند رنگ عرضه می‌شود، برای هر رنگ قیمت و موجودی مستقل تعیین کنید.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={addVariantRow}>
                        <Plus className="w-4 h-4 ml-1" /> افزودن رنگ
                      </Button>
                    </div>

                    {variants.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                        <Palette className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          این محصول فعلاً بدون رنگ است — قیمت و موجودی همان مقادیر «قیمت و موجودی» بالا اعمال می‌شود.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div key={variant.id ?? `new-${index}`} className="p-4 border-2 border-gray-100 dark:border-slate-700 rounded-xl space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="color"
                                  value={/^#[0-9a-fA-F]{6}$/.test(variant.color_code) ? variant.color_code : '#000000'}
                                  onChange={(e) => updateVariantField(index, 'color_code', e.target.value)}
                                  className="w-9 h-9 rounded-lg border-2 border-gray-200 dark:border-slate-600 cursor-pointer flex-shrink-0"
                                  title="انتخاب رنگ"
                                />
                                <input
                                  type="text"
                                  value={variant.color_name}
                                  onChange={(e) => updateVariantField(index, 'color_name', e.target.value)}
                                  placeholder="نام رنگ (مثلاً: مشکی)"
                                  className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm font-bold"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariantRow(index)}
                                className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg flex-shrink-0"
                                aria-label="حذف این رنگ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">SKU</label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariantField(index, 'sku', e.target.value)}
                                  className="w-full px-2.5 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm"
                                  dir="ltr"
                                />
                              </div>
                              <div>
                                {/* ✅ «قیمت این رنگ» — عمداً صریح، تا روشن باشد این
                                    مستقل از قیمت رنگ‌های دیگر یا قیمت پایه‌ی
                                    محصول است. */}
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">قیمت این رنگ</label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariantField(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-2.5 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm font-mono"
                                  dir="ltr"
                                  placeholder="مثلاً قیمت پایه"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">قیمت با تخفیف</label>
                                <input
                                  type="number"
                                  value={variant.compare_price}
                                  onChange={(e) => updateVariantField(index, 'compare_price', e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-2.5 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm font-mono"
                                  dir="ltr"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">موجودی این رنگ</label>
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariantField(index, 'stock', e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-2.5 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm font-mono"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('pricing')}><ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل</Button>
                      <Button onClick={() => setActiveStep('specs')}>مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                    </div>
                  </div>
                )}

                {/* Step: Specs */}
                {activeStep === 'specs' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">مشخصات فنی</h3>
                      <Button size="sm" variant="outline" onClick={() => setSpecifications(prev => [...prev, { key: '', value: '' }])}>
                        <Plus className="w-4 h-4 ml-1" /> افزودن
                      </Button>
                    </div>
                    {specifications.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                        <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">مشخصاتی اضافه نشده</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {specifications.map((spec, index) => (
                          <div key={index} className="flex gap-2">
                            <input type="text" value={spec.key} onChange={(e) => { const u = [...specifications]; u[index].key = e.target.value; setSpecifications(u); }} className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" placeholder="نام ویژگی" />
                            <input type="text" value={spec.value} onChange={(e) => { const u = [...specifications]; u[index].value = e.target.value; setSpecifications(u); }} className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" placeholder="مقدار" />
                            <button onClick={() => setSpecifications(prev => prev.filter((_, i) => i !== index))} className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('variants')}><ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل</Button>
                      <Button onClick={() => setActiveStep('models')}>مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                    </div>
                  </div>
                )}

                {/* Step: Models */}
                {activeStep === 'models' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">مدل‌های سازگار</h3>
                      {selectedModelIds.length > 0 && <Badge variant="success">{selectedModelIds.length} مدل انتخاب شده</Badge>}
                    </div>

                    {selectedModelIds.length > 0 && (
                      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
                        <p className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-2">انتخاب‌شده‌ها:</p>
                        <div className="flex flex-wrap gap-2">
                          {allDeviceModels.filter((m: { id: number }) => selectedModelIds.includes(m.id)).map((model: { id: number; name: string; brand?: { name: string } }) => (
                            <div key={model.id} className="flex items-center gap-2 bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                              <span>{model.name}</span>
                              {model.brand && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{model.brand.name}</span>}
                              <button onClick={() => toggleModel(model.id)} className="hover:bg-white/20 rounded p-0.5"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" placeholder="جستجوی مدل..." />
                      </div>
                      <select value={selectedBrandFilter} onChange={(e) => setSelectedBrandFilter(e.target.value)} className="px-3 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500">
                        <option value="all">همه برندها</option>
                        {uniqueBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                      </select>
                    </div>

                    {isLoadingModels ? (
                      <div className="text-center py-8"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2 border-2 border-gray-100 dark:border-slate-700 rounded-xl">
                        {filteredModels.length > 0 ? (
                          filteredModels.map((model: { id: number; name: string; brand?: { name: string } }) => {
                            const isSelected = selectedModelIds.includes(model.id);
                            return (
                              <button key={model.id} type="button" onClick={() => toggleModel(model.id)} className={cn('px-3 py-2 rounded-lg text-xs font-semibold transition-all', isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600')}>
                                {model.name}
                                {model.brand && <span className={cn('text-[10px] ml-1 px-1 rounded', isSelected ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-600')}>{model.brand.name}</span>}
                              </button>
                            );
                          })
                        ) : (
                          <div className="w-full text-center py-8 text-gray-500 dark:text-gray-400"><Smartphone className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" /><p>مدلی یافت نشد</p></div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('specs')}><ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل</Button>
                      <Button onClick={handleSubmit} disabled={isSubmitting || images.length === 0}>
                        {isSubmitting ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> در حال ذخیره...</> : <><Save className="w-4 h-4 ml-2" /> {mode === 'create' ? 'ثبت محصول' : 'ذخیره تغییرات'}</>}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ✅ Marketplace Unification فاز A1: «محصولات مکمل» — برخلاف
                    مراحل بالا، اینجا هر افزودن/حذف بلافاصله با API خودش
                    ذخیره می‌شود (مثل device_model_ids نیست که فقط با
                    «ذخیره تغییرات» کلی ارسال شود) — چون این رابطه از قبل
                    یک منبع مستقل و بلادرنگ در بک‌اند است. */}
                {activeStep === 'relationships' && mode === 'edit' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">محصولات مکمل («همراه این محصول»)</h3>
                      {relationships.length > 0 && <Badge variant="success">{relationships.length} محصول</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      محصولاتی که پیشنهاد می‌شود همراه این محصول خریداری شوند (مثلاً شارژر برای گوشی). فقط محصولات خودتان قابل‌انتخاب‌اند.
                    </p>

                    {isLoadingRelationships ? (
                      <div className="text-center py-8"><Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /></div>
                    ) : relationships.length > 0 ? (
                      <div className="space-y-2">
                        {relationships.map((rel) => (
                          <div key={rel.id} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-lg p-2.5">
                            <SafeImage src={rel.target_product?.main_image || ''} alt={rel.target_product?.name || ''} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" fallbackEmoji="📦" />
                            <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {rel.target_product?.name || 'محصول حذف‌شده'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRelationshipMutation.mutate(rel.id)}
                              disabled={removeRelationshipMutation.isPending}
                              className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                        <Link2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">هنوز محصول مکملی اضافه نشده</p>
                      </div>
                    )}

                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={relationshipSearch}
                        onChange={(e) => setRelationshipSearch(e.target.value)}
                        className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                        placeholder="جستجوی محصول برای افزودن..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2 border-2 border-gray-100 dark:border-slate-700 rounded-xl">
                      {(() => {
                        const relatedIds = new Set(relationships.map((r) => r.target_product?.id).filter(Boolean));
                        const candidates = sellerProducts.filter((p) =>
                          p.id !== productId &&
                          !relatedIds.has(p.id) &&
                          (relationshipSearch.trim() === '' || p.name.toLowerCase().includes(relationshipSearch.trim().toLowerCase()))
                        );
                        if (candidates.length === 0) {
                          return (
                            <div className="w-full text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                              محصول دیگری برای افزودن یافت نشد
                            </div>
                          );
                        }
                        return candidates.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addRelationshipMutation.mutate(p.id)}
                            disabled={addRelationshipMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            {p.name}
                          </button>
                        ));
                      })()}
                    </div>

                    <div className="flex justify-start pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('models')}><ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">

                {/* ✅ بخش جدید: سوئیچ وضعیت انتشار */}
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    وضعیت انتشار
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.is_active ? 'محصول در سایت نمایش داده می‌شود' : 'محصول به صورت پیش‌نویس است'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('is_active', !formData.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                        formData.is_active ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* بخش تصاویر */}
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    تصاویر ({images.length})
                  </h3>
                  <div className="space-y-2 mb-3">
                    {images.length > 0 ? (
                      images.map((image, index) => (
                        <div key={index} className="relative group">
                          <SafeImage
                            src={image}
                            alt=""
                            className="w-full aspect-square object-cover rounded-xl bg-gray-100 dark:bg-slate-700"
                            showEmojiOnError
                            fallbackEmoji="📦"
                          />
                          <button onClick={() => setImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 w-6 h-6 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && <span className="absolute bottom-1 right-1 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full">اصلی</span>}
                        </div>
                      ))
                    ) : (
                      <div className="w-full aspect-square border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-900">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <span className="text-xs font-medium">هنوز تصویری اضافه نشده</span>
                      </div>
                    )}
                  </div>
                  <ImageUploader onUploadComplete={(urls) => setImages(prev => [...prev, ...urls])} maxFiles={5} maxSizeMB={4} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default ProductFormModal;
