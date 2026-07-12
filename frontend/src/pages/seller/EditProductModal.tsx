import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Package,
  DollarSign,
  Tag,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useUpdateProduct } from '@/hooks/api/useSellerProducts';
import { categoryService } from '@/services/api/category.service';
import { deviceService, DeviceModel } from '@/services/api/device.service';
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

interface FormErrors {
  [key: string]: string;
}

interface Specification {
  key: string;
  value: string;
}

type Step = 'basic' | 'pricing' | 'specs' | 'models';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

// ==================== Validation ====================
const validateField = (name: string, value: any): string => {
  switch (name) {
    case 'name':
      if (!value) return 'نام محصول الزامی است';
      if (value.length < 3) return 'نام محصول باید حداقل ۳ کاراکتر باشد';
      return '';
    case 'price':
      if (!value || value <= 0) return 'قیمت باید بزرگتر از صفر باشد';
      return '';
    case 'stock':
      if (value === '' || value === null || value === undefined) return 'موجودی الزامی است';
      if (value < 0) return 'موجودی نمی‌تواند منفی باشد';
      return '';
    case 'category_id':
      if (!value) return 'دسته‌بندی را انتخاب کنید';
      return '';
    case 'description':
      if (!value) return 'توضیحات محصول الزامی است';
      if (value.length < 10) return 'توضیحات باید حداقل ۱۰ کاراکتر باشد';
      return '';
    default:
      return '';
  }
};

// ==================== Main Component ====================
export function EditProductModal({ isOpen, onClose, productId }: EditProductModalProps) {
  const updateProductMutation = useUpdateProduct(productId);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    price: 0,
    discount_price: 0,
    stock: 0,
    category_id: 0,
    description: '',
    short_description: '',
    sku: '',
    is_active: true,
    is_featured: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [activeStep, setActiveStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // ==================== Fetch Product Data ====================
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await apiClient.get(`/seller/products/${productId}`);
      return response.data.data;
    },
    enabled: isOpen && !!productId,
  });

  // ==================== Fetch Categories ====================
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryService.getAll();
      return response.data || [];
    },
    enabled: isOpen,
  });

  // ==================== Fetch Device Models ====================
  const { data: allDeviceModels = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['device-models'],
    queryFn: async () => {
      const brands = await deviceService.getBrands();
      const models: DeviceModel[] = [];
      for (const brand of brands) {
        try {
          const series = await deviceService.getSeries(brand.id);
          for (const s of series) {
            try {
              const modelsList = await deviceService.getModels(s.id);
              models.push(...modelsList.map((m: any) => ({ ...m, brand })));
            } catch (err) {
              console.error(`Error loading models for series ${s.id}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error loading series for brand ${brand.id}:`, err);
        }
      }
      return models;
    },
    enabled: isOpen,
  });

  // ==================== Filtered Models ====================
  const filteredModels = useMemo(() => {
    let models = allDeviceModels;
    if (selectedBrand !== 'all') {
      models = models.filter(m => m.brand?.name === selectedBrand);
    }
    if (modelSearch.trim()) {
      const search = modelSearch.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.brand?.name.toLowerCase().includes(search)
      );
    }
    return models;
  }, [allDeviceModels, selectedBrand, modelSearch]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(allDeviceModels.map(m => m.brand?.name).filter(Boolean))) as string[];
  }, [allDeviceModels]);

  // ==================== Load Product Data into Form ====================
  useEffect(() => {
    if (product && !isLoaded) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        price: parseFloat(product.price) || 0,
        discount_price: parseFloat(product.discount_price) || 0,
        stock: product.stock || 0,
        category_id: product.category_id || 0,
        description: product.description || '',
        short_description: product.short_description || '',
        sku: product.sku || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
      });

      // Load images
      const productImages: string[] = [];
      if (product.main_image) productImages.push(product.main_image);
      if (product.gallery && Array.isArray(product.gallery)) {
        productImages.push(...product.gallery);
      }
      setImages(productImages);
      setIsLoaded(true);
    }
  }, [product, isLoaded]);

  // ==================== Handlers ====================
  const generateSlug = useCallback((name: string) => {
    return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }, []);

  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'name') newData.slug = generateSlug(value);
      return newData;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors, generateSlug]);

  const handleUploadComplete = useCallback((urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
    toast.success(`${urls.length} تصویر آپلود شد`, { icon: '🖼️' });
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleModel = useCallback((modelId: number) => {
    setSelectedModels(prev =>
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  }, []);

  const addSpecification = useCallback(() => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  }, []);

  const removeSpecification = useCallback((index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSpecification = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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

    try {
      await updateProductMutation.mutateAsync({
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
      });

      toast.success('محصول با موفقیت به‌روزرسانی شد', { icon: '✅' });
      handleClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'خطا در به‌روزرسانی محصول';
      toast.error(message, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, images, validateForm, updateProductMutation]);

  const handleClose = useCallback(() => {
    setIsLoaded(false);
    setErrors({});
    setActiveStep('basic');
    setImages([]);
    setSelectedModels([]);
    setSpecifications([]);
    onClose();
  }, [onClose]);

  const steps = [
    { id: 'basic', label: 'اطلاعات پایه', icon: FileText },
    { id: 'pricing', label: 'قیمت', icon: DollarSign },
    { id: 'specs', label: 'مشخصات', icon: Tag },
    { id: 'models', label: 'سازگاری', icon: Smartphone },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  if (!isOpen) return null;

  // Loading state
  if (isLoadingProduct) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={handleClose} />
        <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">در حال بارگذاری اطلاعات محصول...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" onClick={handleClose} />

      {/* Modal Container */}
      <div className="fixed inset-2 md:inset-4 lg:inset-12 z-50 flex items-center justify-center animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-l from-primary-50 to-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md">
                <Edit className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">ویرایش محصول</h2>
                <p className="text-[10px] text-gray-500">{formData.name}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all hover:rotate-90">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Steps */}
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const isPast = currentStepIndex > idx;
                return (
                  <div key={step.id} className="flex items-center gap-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveStep(step.id as Step)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex-1',
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                          : isPast
                          ? 'bg-success-50 text-success-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {isPast ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className={cn('w-3 h-0.5 flex-shrink-0', isPast ? 'bg-success-500' : 'bg-gray-200')} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
              
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Step: Basic */}
                {activeStep === 'basic' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">نام محصول <span className="text-error-500">*</span></label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                        placeholder="نام محصول"
                      />
                      {errors.name && <p className="text-error-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleFieldChange('slug', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">دسته‌بندی <span className="text-error-500">*</span></label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => handleFieldChange('category_id', Number(e.target.value))}
                        disabled={isLoadingCategories}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                      >
                        <option value={0}>{isLoadingCategories ? 'در حال بارگذاری...' : 'انتخاب کنید'}</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.category_id && <p className="text-error-500 text-xs mt-1">{errors.category_id}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">SKU</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleFieldChange('sku', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">توضیحات <span className="text-error-500">*</span></label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
                        placeholder="توضیحات محصول..."
                      />
                      {errors.description && <p className="text-error-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">توضیحات کوتاه</label>
                      <textarea
                        value={formData.short_description}
                        onChange={(e) => handleFieldChange('short_description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
                        placeholder="خلاصه محصول..."
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setActiveStep('pricing')} size="sm">
                        مرحله بعد <ArrowLeft className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Pricing */}
                {activeStep === 'pricing' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">قیمت (تومان) *</label>
                        <input
                          type="number"
                          value={formData.price || ''}
                          onChange={(e) => handleFieldChange('price', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                          dir="ltr"
                        />
                        {errors.price && <p className="text-error-500 text-xs mt-1">{errors.price}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">قیمت با تخفیف</label>
                        <input
                          type="number"
                          value={formData.discount_price || ''}
                          onChange={(e) => handleFieldChange('discount_price', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">موجودی *</label>
                      <input
                        type="number"
                        value={formData.stock || ''}
                        onChange={(e) => handleFieldChange('stock', Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                        dir="ltr"
                      />
                      {errors.stock && <p className="text-error-500 text-xs mt-1">{errors.stock}</p>}
                    </div>

                    {formData.discount_price > 0 && formData.price > formData.discount_price && (
                      <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-error-600" />
                        <p className="text-xs text-error-700">
                          تخفیف {Math.round(((formData.price - formData.discount_price) / formData.price) * 100)}٪ فعال!
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setActiveStep('basic')} size="sm">
                        <ArrowLeft className="w-3.5 h-3.5 ml-1.5 rotate-180" /> مرحله قبل
                      </Button>
                      <Button onClick={() => setActiveStep('specs')} size="sm">
                        مرحله بعد <ArrowLeft className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Specs */}
                {activeStep === 'specs' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">مشخصات فنی</h3>
                      <Button size="sm" variant="outline" onClick={addSpecification}>
                        <Plus className="w-3.5 h-3.5 ml-1" /> افزودن
                      </Button>
                    </div>

                    {specifications.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">مشخصاتی اضافه نشده</p>
                        <Button size="sm" variant="outline" onClick={addSpecification} className="mt-2">
                          <Plus className="w-3.5 h-3.5 ml-1" /> افزودن مشخصه
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {specifications.map((spec, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={spec.key}
                              onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                              placeholder="ویژگی"
                            />
                            <input
                              type="text"
                              value={spec.value}
                              onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                              placeholder="مقدار"
                            />
                            <button onClick={() => removeSpecification(index)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setActiveStep('pricing')} size="sm">
                        <ArrowLeft className="w-3.5 h-3.5 ml-1.5 rotate-180" /> مرحله قبل
                      </Button>
                      <Button onClick={() => setActiveStep('models')} size="sm">
                        مرحله بعد <ArrowLeft className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Models */}
                {activeStep === 'models' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">مدل‌های سازگار</h3>
                      {selectedModels.length > 0 && (
                        <Badge variant="success" size="sm">{selectedModels.length} مدل</Badge>
                      )}
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={modelSearch}
                          onChange={(e) => setModelSearch(e.target.value)}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                          placeholder="جستجوی مدل..."
                        />
                      </div>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                      >
                        <option value="all">همه برندها</option>
                        {uniqueBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    {isLoadingModels ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border-2 border-gray-100 rounded-lg">
                        {filteredModels.length > 0 ? (
                          filteredModels.map((model: any) => {
                            const isSelected = selectedModels.includes(model.id);
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => toggleModel(model.id)}
                                className={cn(
                                  'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                                  isSelected
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                              >
                                {model.name}
                                {model.brand && (
                                  <span className={cn('text-[10px] ml-1 px-1 rounded', isSelected ? 'bg-white/20' : 'bg-gray-200')}>
                                    {model.brand.name}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <p className="w-full text-center py-4 text-gray-500 text-xs">مدلی یافت نشد</p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setActiveStep('specs')} size="sm">
                        <ArrowLeft className="w-3.5 h-3.5 ml-1.5 rotate-180" /> مرحله قبل
                      </Button>
                      <Button onClick={handleSubmit} size="sm" disabled={isSubmitting || images.length === 0}>
                        {isSubmitting ? (
                          <><Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" /> در حال ذخیره...</>
                        ) : (
                          <><Save className="w-3.5 h-3.5 ml-2" /> ذخیره تغییرات</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Images */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary-600" />
                    تصاویر ({images.length})
                  </h3>

                  <div className="space-y-2 mb-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img src={image} alt="" className="w-full aspect-square object-cover rounded-lg" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 right-1 bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            اصلی
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <ImageUploader onUploadComplete={handleUploadComplete} maxFiles={5} maxSizeMB={4} />
                </div>

                {/* Submit in sidebar */}
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  size="sm"
                  disabled={isSubmitting || images.length === 0}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" /> در حال ذخیره...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5 ml-2" /> ذخیره تغییرات</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}