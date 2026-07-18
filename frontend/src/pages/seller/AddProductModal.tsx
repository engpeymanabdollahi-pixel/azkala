import { useState, useCallback, useMemo } from 'react';
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
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useCreateProduct } from '@/hooks/api/useSellerProducts';
import { categoryService } from '@/services/api/category.service';
import { deviceService } from '@/services/api/device.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

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

interface DeviceModelWithBrand {
  id: number;
  name: string;
  slug: string;
  image?: string;
  release_year?: number;
  brand?: {
    id: number;
    name: string;
    slug: string;
  };
}

type Step = 'basic' | 'pricing' | 'specs' | 'models';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
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
export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const createProductMutation = useCreateProduct();
  
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
  const [selectedModels, setSelectedModels] = useState<DeviceModelWithBrand[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [activeStep, setActiveStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryService.getAll();
      return response.data || [];
    },
    enabled: isOpen,
  });

   // Fetch device models with brands (با مدیریت خطای بهتر)
    // ✅ دریافت مدل‌ها با یک درخواست واحد (حل مشکل N+1)
  const { data: allDeviceModels = [], isLoading: isLoadingModels, error: modelsError } = useQuery({
    queryKey: ['device-hierarchy'],
    queryFn: async () => {
      const models = await deviceService.getHierarchy();
      console.log('✅ مدل‌های دریافت شده از سرور:', models); // برای دیباگ در کنسول
      return models;
    },
    enabled: isOpen,
  });

  // Filter models by search and brand
  const filteredModels = useMemo(() => {
    let models = allDeviceModels;
    
    if (selectedBrandFilter !== 'all') {
      models = models.filter(m => m.brand?.name === selectedBrandFilter);
    }
    
    if (modelSearch.trim()) {
      const search = modelSearch.toLowerCase();
      models = models.filter(m => 
        m.name.toLowerCase().includes(search) ||
        m.brand?.name.toLowerCase().includes(search)
      );
    }
    
    return models;
  }, [allDeviceModels, selectedBrandFilter, modelSearch]);

  // Get unique brands for filter
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(allDeviceModels.map(m => m.brand?.name).filter(Boolean))) as string[];
  }, [allDeviceModels]);

  // Generate slug
  const generateSlug = useCallback((name: string) => {
    return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }, []);

  // Handle field change
  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'name') newData.slug = generateSlug(value);
      return newData;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors, generateSlug]);

  // Handle upload
  const handleUploadComplete = useCallback((urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
    toast.success(`${urls.length} تصویر آپلود شد`, { icon: '🖼️' });
  }, []);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Toggle model
  const toggleModel = useCallback((model: DeviceModelWithBrand) => {
    setSelectedModels(prev => 
      prev.find(m => m.id === model.id)
        ? prev.filter(m => m.id !== model.id)
        : [...prev, model]
    );
  }, []);

  // Remove selected model
  const removeSelectedModel = useCallback((modelId: number) => {
    setSelectedModels(prev => prev.filter(m => m.id !== modelId));
  }, []);

  // Add specification
  const addSpecification = useCallback(() => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  }, []);

  // Update specification
  const updateSpecification = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Remove specification
  const removeSpecification = useCallback((index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validate
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

   // Submit
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
      await createProductMutation.mutateAsync({
        name: formData.name.trim(),
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
        // ✅ افزودن مدل‌های انتخاب‌شده به درخواست
        device_model_ids: selectedModels.map(m => m.id), 
      });

      toast.success('محصول با موفقیت ثبت شد', { icon: '✅' });
      handleClose();
    } catch (error: any) {
      console.error('خطای ثبت محصول:', error);
      toast.error(error.response?.data?.message || 'خطا در ثبت محصول', { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, images, selectedModels, validateForm, createProductMutation]);

  // Reset form on close
  const handleClose = useCallback(() => {
    setFormData({
      name: '', slug: '', price: 0, discount_price: 0, stock: 0,
      category_id: 0, description: '', short_description: '', sku: '',
      is_active: true, is_featured: false,
    });
    setImages([]);
    setSelectedModels([]);
    setSpecifications([]);
    setActiveStep('basic');
    setErrors({});
    setModelSearch('');
    setSelectedBrandFilter('all');
    onClose();
  }, [onClose]);

  const steps = [
    { id: 'basic', label: 'پایه', icon: FileText },
    { id: 'pricing', label: 'قیمت', icon: DollarSign },
    { id: 'specs', label: 'مشخصات', icon: Tag },
    { id: 'models', label: 'سازگاری', icon: Smartphone },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-l from-primary-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">افزودن محصول جدید</h2>
                <p className="text-xs text-gray-500">اطلاعات محصول را وارد کنید</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all hover:rotate-90"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
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
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                          : isPast
                          ? 'bg-success-50 text-success-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      )}
                    >
                      {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className={cn('w-4 h-0.5 flex-shrink-0', isPast ? 'bg-success-500' : 'bg-gray-200')} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Step: Basic */}
                {activeStep === 'basic' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        نام محصول <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                        placeholder="نام محصول"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        دسته‌بندی <span className="text-error-500">*</span>
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => handleFieldChange('category_id', Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                      >
                        <option value={0}>انتخاب کنید</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        توضیحات <span className="text-error-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 resize-none"
                        placeholder="توضیحات کامل محصول..."
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setActiveStep('pricing')}>
                        مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Pricing */}
                {activeStep === 'pricing' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">قیمت *</label>
                        <input
                          type="number"
                          value={formData.price || ''}
                          onChange={(e) => handleFieldChange('price', Number(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 font-mono"
                          placeholder="150000"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">قیمت با تخفیف</label>
                        <input
                          type="number"
                          value={formData.discount_price || ''}
                          onChange={(e) => handleFieldChange('discount_price', Number(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 font-mono"
                          placeholder="120000"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">موجودی *</label>
                      <input
                        type="number"
                        value={formData.stock || ''}
                        onChange={(e) => handleFieldChange('stock', Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 font-mono"
                        placeholder="50"
                        dir="ltr"
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('basic')}>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل
                      </Button>
                      <Button onClick={() => setActiveStep('specs')}>
                        مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Specs */}
                {activeStep === 'specs' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">مشخصات فنی</h3>
                      <Button size="sm" variant="outline" onClick={addSpecification}>
                        <Plus className="w-4 h-4 ml-1" /> افزودن
                      </Button>
                    </div>

                    {specifications.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                        <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">مشخصاتی اضافه نشده</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {specifications.map((spec, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={spec.key}
                              onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                              placeholder="نام ویژگی"
                            />
                            <input
                              type="text"
                              value={spec.value}
                              onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                              placeholder="مقدار"
                            />
                            <button onClick={() => removeSpecification(index)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('pricing')}>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل
                      </Button>
                      <Button onClick={() => setActiveStep('models')}>
                        مرحله بعد <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step: Models - با جستجو و فیلتر */}
                {activeStep === 'models' && (
                  <div className="space-y-5 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-900">مدل‌های سازگار</h3>

                    {/* Selected Models */}
                    {selectedModels.length > 0 && (
                      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                        <p className="text-sm font-bold text-primary-700 mb-2">
                          مدل‌های انتخاب شده ({selectedModels.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedModels.map((model) => (
                            <div
                              key={model.id}
                              className="flex items-center gap-2 bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              <span>{model.name}</span>
                              {model.brand && (
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                                  {model.brand.name}
                                </span>
                              )}
                              <button
                                onClick={() => removeSelectedModel(model.id)}
                                className="hover:bg-white/20 rounded p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search and Filter */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={modelSearch}
                          onChange={(e) => setModelSearch(e.target.value)}
                          className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                          placeholder="جستجوی مدل..."
                        />
                      </div>
                      <select
                        value={selectedBrandFilter}
                        onChange={(e) => setSelectedBrandFilter(e.target.value)}
                        className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                      >
                        <option value="all">همه برندها</option>
                        {uniqueBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    {/* Models List */}
                    {isLoadingModels ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                        <p className="text-gray-500 mt-2">در حال بارگذاری مدل‌ها...</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2 border-2 border-gray-100 rounded-xl">
                        {filteredModels.length > 0 ? (
                          filteredModels.map((model) => {
                            const isSelected = selectedModels.find(m => m.id === model.id);
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => toggleModel(model)}
                                className={cn(
                                  'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                                  isSelected
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                              >
                                {model.name}
                                {model.brand && (
                                  <span className={cn(
                                    'text-[10px] ml-1',
                                    isSelected ? 'bg-white/20 px-1 rounded' : 'bg-gray-200 px-1 rounded'
                                  )}>
                                    {model.brand.name}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="w-full text-center py-8 text-gray-500">
                            <Smartphone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>مدلی یافت نشد</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveStep('specs')}>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" /> مرحله قبل
                      </Button>
                      <Button onClick={handleSubmit} disabled={isSubmitting || images.length === 0}>
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> در حال ثبت...</>
                        ) : (
                          <><Save className="w-4 h-4 ml-2" /> ثبت محصول</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary-600" />
                    تصاویر ({images.length})
                  </h3>

                  <div className="space-y-2 mb-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img src={image} alt="" className="w-full aspect-square object-cover rounded-xl" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 right-1 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                            اصلی
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <ImageUploader onUploadComplete={handleUploadComplete} maxFiles={5} maxSizeMB={4} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}