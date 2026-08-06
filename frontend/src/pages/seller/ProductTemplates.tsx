import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Package, Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/Badge';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

interface ProductTemplate {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  main_image?: string;
   gallery?: string[]; // ✅ اضافه شد
  specifications?: Record<string, any>; // ✅ اضافه شد
  price: number;
  compare_price?: number;
  discount_price?: number;
  stock: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
}

export default function ProductTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyingId, setCopyingId] = useState<number | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/products/templates', {
        params: { search: searchTerm, per_page: 50 }
      });
      setTemplates(res.data?.data?.data || []);
    } catch (error) {
      toast.error('خطا در بارگذاری محصولات آماده');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (templateId: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این محصول را به فروشگاه خود اضافه کنید؟')) return;
    
    try {
      setCopyingId(templateId);
      const res = await apiClient.post(`/seller/products/copy-template/${templateId}`);
      toast.success(res.data.message || 'محصول با موفقیت کپی شد!');
      
      // انتقال به صفحه ویرایش محصول جدید
      setTimeout(() => {
       navigate(`/seller/products/${res.data.data.product.id}/edit`);
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در کپی محصول');
    } finally {
      setCopyingId(null);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('fa-IR').format(price) + ' تومان';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            کتابخانه محصولات آماده
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            محصولات آماده را با یک کلیک به فروشگاه خود اضافه کنید و فقط قیمت و موجودی را تنظیم کنید
          </p>
        </div>
        <Link to="/seller/products">
          <Button variant="outline">
            <Package className="w-4 h-4 ml-2" />
            مشاهده محصولات من
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو در محصولات آماده (نام، برند، دسته‌بندی)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-gray-500 mt-4">در حال بارگذاری محصولات...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <p className="font-black text-gray-900 mb-2">محصول آماده‌ای یافت نشد</p>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'جستجوی خود را تغییر دهید' : 'هنوز محصول آماده‌ای در سیستم ثبت نشده است'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => (
            <div 
              key={template.id} 
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-50 overflow-hidden">
                {template.main_image ? (
                  <img 
                    src={template.main_image} 
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-16 h-16" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {template.category && (
                    <Badge variant="primary" size="sm">
                      {template.category.name}
                    </Badge>
                  )}
                  {template.brand && (
                    <Badge variant="secondary" size="sm">
                      {template.brand.name}
                    </Badge>
                  )}
                </div>
                                {/* ✅ Device Compatibility Badges (نمایش دستگاه‌های سازگار) */}
                {template.device_models && template.device_models.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex flex-wrap gap-1 justify-end max-w-[90%]">
                    {template.device_models.slice(0, 2).map((device: any) => (
                      <Badge key={device.id} variant="outline" className="bg-white/95 backdrop-blur text-[10px] font-bold text-primary-700 border-primary-200 shadow-sm">
                        📱 {device.name}
                      </Badge>
                    ))}
                    {template.device_models.length > 2 && (
                      <Badge variant="outline" className="bg-white/95 backdrop-blur text-[10px] font-bold text-gray-600">
                        +{template.device_models.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {template.discount_price && template.compare_price && (
                  <div className="absolute top-2 left-2 bg-error-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {Math.round((1 - template.discount_price / template.compare_price) * 100)}% تخفیف
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="font-black text-gray-900 line-clamp-2 min-h-[3rem]">
                  {template.name}
                </h3>

                {template.short_description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {template.short_description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100">
                  <span className="text-lg font-black text-primary-600">
                    {formatPrice(template.discount_price || template.price)}
                  </span>
                  {template.compare_price && template.compare_price > template.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(template.compare_price)}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>موجودی الگو: {template.stock} عدد</span>
                  <Badge variant={template.stock > 0 ? 'success' : 'error'} size="sm">
                    {template.stock > 0 ? 'موجود' : 'ناموجود'}
                  </Badge>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleCopy(template.id)}
                  disabled={copyingId === template.id}
                  className="w-full"
                >
                  {copyingId === template.id ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال کپی...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 ml-2" />
                      افزودن به فروشگاه من
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}