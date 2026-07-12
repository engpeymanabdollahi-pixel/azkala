import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Search, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  ArrowLeft,
  X,
  Store,
  Shield
} from 'lucide-react';
import { useModelStore } from '@/store/modelStore';
import { mockBrands } from '@/data/mockData';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface BrandsPageProps {
  onNavigate?: (page: string) => void;
}

export function BrandsPage({ onNavigate }: BrandsPageProps) {
  const navigate = useNavigate();
  const { openModal } = useModelStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // شبیه‌سازی لودینگ برای تجربه کاربری بهتر
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // فیلتر کردن برندها بر اساس جستجو
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return mockBrands;
    return mockBrands.filter(brand => 
      brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleBrandClick = () => {
    openModal();
  };

  const handleImageError = (brandId: number) => {
    setImageErrors(prev => ({ ...prev, [brandId]: true }));
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* ==================== Hero Section ==================== */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-8 md:p-12 text-white mb-10 overflow-hidden shadow-2xl shadow-primary-500/20">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right flex-1">
              <Badge variant="warning" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 ml-1" />
                بیش از ۵۰ برند معتبر
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                برندهای مورد اعتماد شما، <br className="hidden md:block" />
                <span className="text-accent-200">در ازکالا</span>
              </h1>
              <p className="text-white/90 text-lg max-w-xl leading-relaxed">
                بهترین و باکیفیت‌ترین لوازم جانبی موبایل را از معتبرترین برندهای جهانی، 
                با ضمانت اصالت و بهترین قیمت تهیه کنید.
              </p>
            </div>
            
            {/* Stats Mini Cards */}
            <div className="flex gap-4 flex-wrap justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
                <Store className="w-6 h-6 mx-auto mb-2 text-accent-300" />
                <p className="text-2xl font-black">{mockBrands.length}+</p>
                <p className="text-xs text-white/80">برند فعال</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
                <Shield className="w-6 h-6 mx-auto mb-2 text-success-300" />
                <p className="text-2xl font-black">۱۰۰٪</p>
                <p className="text-xs text-white/80">ضمانت اصالت</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== Search Bar ==================== */}
        <div className="max-w-2xl mx-auto mb-10 relative">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="جستجوی نام برند (مثلاً: اپل، سامسونگ، انکر...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-12 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all text-gray-900 placeholder-gray-400 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ==================== Brands Grid ==================== */}
        {isLoading ? (
          // Skeleton Loading
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredBrands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredBrands.map((brand, index) => (
              <button
                key={brand.id}
                onClick={handleBrandClick}
                className={cn(
                  "group relative bg-white rounded-2xl border-2 border-gray-100 p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 overflow-hidden",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Logo Container */}
                <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-gray-50 rounded-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md">
                  {imageErrors[brand.id] ? (
                    <div className="text-4xl grayscale group-hover:grayscale-0 transition-all">📱</div>
                  ) : (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain p-2"
                      onError={() => handleImageError(brand.id)}
                    />
                  )}
                </div>

                {/* Brand Info */}
                <div className="relative z-10 text-center w-full">
                  <h3 className="font-black text-gray-900 text-base group-hover:text-primary-600 transition-colors mb-2 truncate">
                    {brand.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md group-hover:bg-white transition-colors">
                      <TrendingUp className="w-3 h-3" />
                      {brand.series_count || 0} سری
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md group-hover:bg-white transition-colors">
                      <Smartphone className="w-3 h-3" />
                      {brand.models_count || 0} مدل
                    </span>
                  </div>
                </div>

                {/* Action Badge (Shows on Hover) */}
                <div className="relative z-10 mt-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Badge variant="primary" className="gap-1.5 shadow-md">
                    انتخاب مدل
                    <ArrowLeft className="w-3 h-3" />
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">برندی یافت نشد</h3>
            <p className="text-gray-500 mb-6">
              متأسفانه برندی با نام "{searchQuery}" در لیست برندهای ما وجود ندارد.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              پاک کردن جستجو
            </Button>
          </div>
        )}

        {/* ==================== Bottom CTA Section ==================== */}
        <div className="mt-16 bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0xMHY2aC02VjI0aDZ6bTAgMTB2NmgtNlYzNGg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Smartphone className="w-8 h-8 text-accent-300" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4">برند مورد نظر خود را پیدا نکردید؟</h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              ما به‌صورت مداوم برندهای جدید و پرطرفدار را به ازکالا اضافه می‌کنیم. 
              همچنین می‌توانید مستقیماً نام محصول مورد نظر خود را در نوار جستجوی اصلی سایت جستجو کنید.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold"
                onClick={() => handleNavigate('/products')}
              >
                <Search className="w-5 h-5 mr-2" />
                جستجوی مستقیم محصولات
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => handleNavigate('/contact')}
              >
                <Store className="w-5 h-5 mr-2" />
                درخواست افزودن برند
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}