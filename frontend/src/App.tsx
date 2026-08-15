// src/App.tsx - پیکربندی اصلی روت‌ها با پشتیبانی از Lazy Loading و Error Boundary
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { captureReferralFromLocation } from '@/lib/referralCapture';
import { AppErrorBoundary } from './components/ErrorBoundary';
import type { ReactNode } from 'react';

// ==========================================
// کامپوننت‌های شناور سراسری (Lazy Loaded)
// فقط وقتی کاربر با آنها تعامل می‌کند بارگذاری می‌شوند
// تأثیر: کاهش ~132 KB از initial bundle
// ==========================================
const CartDrawer = lazy(() => 
  import('@/components/features/CartDrawer').then(m => ({ default: m.CartDrawer }))
);
const ChatWidget = lazy(() => 
  import('@/components/chat/ChatWidget').then(m => ({ default: m.ChatWidget }))
);
const ModelSelectorModal = lazy(() => 
  import('@/components/features/ModelSelector/ModelSelectorModal').then(m => ({ default: m.ModelSelectorModal }))
);
const AuthModal = lazy(() => 
  import('@/components/auth/AuthModal').then(m => ({ default: m.AuthModal }))
);

// ==========================================
// کامپوننت لودینگ صفحه (Spinner)
// ==========================================
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">در حال بارگذاری ازکالا...</p>
      </div>
    </div>
  );
}

// ==========================================
// ایمپورت صفحات پنل ادمین (Lazy Loaded)
// ==========================================
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));
// ✅ AdminBrandsPage و AdminCategoriesPage هم همین باگ را داشتند — فقط از
// طریق ایمپورت مستقیمِ خودِ AdminCatalogPage به‌عنوان تب رندر می‌شوند.
const AdminCatalogPage = lazy(() => import('@/pages/admin/AdminCatalogPage'));
const AdminDeviceBrandsPage = lazy(() => import('@/pages/admin/AdminDeviceBrandsPage'));
const AdminDeviceSeriesPage = lazy(() => import('@/pages/admin/AdminDeviceSeriesPage'));
const AdminCommunicationPage = lazy(() => import('@/pages/admin/AdminCommunicationPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
// ✅ قبلاً اینجا برای هرکدام از این ۸ زیرصفحه یک lazy() جدا هم تعریف شده بود
// که هیچ‌جای این فایل در یک <Route> استفاده نمی‌شد (همه‌شان از طریق ایمپورت
// مستقیمِ خودِ AdminCommunicationPage رندر می‌شوند) — کد کاملاً مرده بود.
const AdminDeviceModelsPage = lazy(() => import('@/pages/admin/AdminDeviceModelsPage'));
const AdminMagazinePage = lazy(() => import('@/pages/admin/AdminMagazinePage'));
const AdminAdsPage = lazy(() => import('@/pages/admin/AdminAdsPage'));
const AdminAccessPage = lazy(() => import('@/pages/admin/AdminAccessPage'));
const ProductTemplatesPage = lazy(() => import('@/pages/seller/ProductTemplates'));

// ==========================================
// ایمپورت صفحات پنل کاربری (Lazy Loaded)
// ==========================================
const UserDashboardLayout = lazy(() => import('@/components/layout/UserDashboardLayout'));
const ProfileSection = lazy(() => import('@/pages/dashboard/ProfileSection'));
const OrdersSection = lazy(() => import('@/pages/dashboard/OrdersSection'));
const WishlistSection = lazy(() => import('@/pages/dashboard/WishlistSection'));
const AddressesSection = lazy(() => import('@/pages/dashboard/AddressesSection'));
const DevicesSection = lazy(() => import('@/pages/dashboard/DevicesSection'));
const AlertsSection = lazy(() => import('@/pages/dashboard/AlertsSection'));
const SecuritySection = lazy(() => import('@/pages/dashboard/SecuritySection'));
const NotificationsSection = lazy(() => import('@/pages/dashboard/NotificationsSection'));
const TicketsSection = lazy(() => import('@/pages/dashboard/TicketsSection'));

// ==========================================
// ایمپورت صفحات پنل فروشندگان (Lazy Loaded)
// ==========================================
const SellerLayout = lazy(() => import('@/components/layout/SellerLayout'));
const SellerDashboard = lazy(() => import('@/pages/seller/SellerDashboard'));
const SellerProducts = lazy(() => import('@/pages/seller/SellerProducts'));
const AddProduct = lazy(() => import('@/pages/seller/AddProduct'));
const EditProduct = lazy(() => import('@/pages/seller/EditProduct'));
const SellerOrders = lazy(() => import('@/pages/seller/SellerOrders'));
const SellerOrderDetail = lazy(() => import('@/pages/seller/SellerOrderDetail'));
const SellerPayouts = lazy(() => import('@/pages/seller/SellerPayouts'));
const SellerLoginPage = lazy(() => import('@/pages/seller/sellerLogin'));
const SellerChatPage = lazy(() => import('@/pages/seller/SellerChatPage'));
const SellerSettings = lazy(() => import('@/pages/seller/SellerSettings'));
// ✅ خط ProductTemplatesPage از اینجا حذف شد چون در بالا تعریف شده است

// ==========================================
// ایمپورت صفحات عمومی سایت (Lazy Loaded)
// ==========================================
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const BrandsPage = lazy(() => import('@/pages/BrandsPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const GuaranteePage = lazy(() => import('@/pages/GuaranteePage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
// ✅ صفحات جدید ممیزی حقوقی/اعتماد: حریم خصوصی، ارسال و شرایط فروشندگان
// قبلاً اصلاً وجود نداشتند.
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const ShippingPage = lazy(() => import('@/pages/ShippingPage'));
const SellerAgreementPage = lazy(() => import('@/pages/SellerAgreementPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const UserTicketsPage = lazy(() => import('@/pages/user/UserTicketsPage'));
const SellerRequestPage = lazy(() => import('@/pages/SellerRequestPage'));
const MagazinePage = lazy(() => import('@/pages/MagazinePage'));
const MagazineArticlePage = lazy(() => import('@/pages/MagazinePage/ArticlePage'));
const SellerPage = lazy(() => import('@/pages/SellerPage'));
// ✅ CompareBar - نوار مقایسه محصولات (Lazy Loaded)
// فقط وقتی کاربر محصولی به مقایسه اضافه کند نمایش داده می‌شود.
// State از طریق zustand persist در localStorage نگه‌داری می‌شود.
const CompareBar = lazy(() => import('@/components/marketplace/CompareBar').then(m => ({ default: m.CompareBar })));

// ✅ ComparePage - صفحه مقایسه محصولات (Lazy Loaded)
// جدول مقایسه specifications، سازگاری دستگاه، و قیمت محصولات انتخاب شده
const ComparePage = lazy(() => import('@/pages/ComparePage'));

// ==========================================
// کامپوننت محافظت از روت‌ها (Protected Route)
// ==========================================
interface ProtectedRouteProps {
  children: ReactNode;
  requireSeller?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

function ProtectedRoute({
  children,
  requireSeller = false,
  requireAdmin = false,
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const openAuthModal = useAuthModalStore((state) => state.open);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // ✅ مقصد اصلی (path+search+hash) را نگه می‌داریم تا بعد از ورود موفق
      // دقیقاً به همان‌جا برگردیم (مثلاً /dashboard/orders)، نه صرفاً «/».
      // قبلاً این مقصد هیچ‌جا ذخیره نمی‌شد — دیپ‌لینک به یک مسیر
      // Protected همیشه بعد از لاگین گم می‌شد (مهم‌تر در TWA که کاربر
      // انتظار جریان app-like دارد، نه ری‌دایرکت گم‌شده).
      const target = `${location.pathname}${location.search}${location.hash}`;

      openAuthModal({
        reason: 'برای دیدن این بخش وارد شوید.',
        onSuccess: () => {
          // ✅ فقط مسیر داخلی نسبی مجاز است (هرگز یک URL مطلق/خارجی یا
          // protocol-relative مثل «//evil.com») — جلوگیری از open-redirect.
          // بعد از ورود موفق isAuthenticated=true می‌شود، پس بازگشت به
          // همان مسیر دوباره از سر باز اعتبارسنجی می‌شود و این بار رد
          // می‌شود، بدون loop.
          const isSafeInternalPath = target.startsWith('/') && !target.startsWith('//');
          navigate(isSafeInternalPath ? target : '/', { replace: true });
        },
      });
    }
  }, [isAuthenticated, openAuthModal, location.pathname, location.search, location.hash, navigate]);

  if (!isAuthenticated) {
    // به خانه برمی‌گردیم نه به /auth: مودال روی همان صفحه باز می‌شود، پس کاربر
    // به‌جای یک فرم تمام‌صفحه، جایی می‌ماند که بتواند ادامه بدهد یا بی‌خیال شود.
    // (بازگشت به مقصد اصلی بعد از لاگین موفق در onSuccess بالا انجام می‌شود.)
    return <Navigate to="/" replace />;
  }

  if (requireSeller && user?.role !== 'seller') {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// ==========================================
// کامپوننت اصلی App
// ==========================================
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ اصلاح منطق مخفی کردن هدر/فوتر:
  // فقط صفحات احراز هویت، ادمین و پنل خصوصی فروشنده هدر اصلی را مخفی می‌کنند.
  // صفحه عمومی فروشگاه (/seller/:slug) هدر و فوتر اصلی سایت را خواهد داشت.
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/seller-request' || location.pathname === '/seller-login';
  const isAdminRoute = location.pathname.startsWith('/admin');
  
    const isPrivateSellerRoute =
    location.pathname === '/seller' ||
    location.pathname.startsWith('/seller/products') ||
    location.pathname.startsWith('/seller/orders') ||
    location.pathname.startsWith('/seller/payouts') ||
    location.pathname.startsWith('/seller/chat') ||  // ✅ خط بعدی با OR وصل می‌شود
    location.pathname.startsWith('/seller/settings'); // ✅ اینجا سمی‌کالن می‌آید چون پایان عبارت است

  const hideLayout = isPrivateSellerRoute || isAuthPage || isAdminRoute;

  // اسکرول به بالای صفحه هنگام تغییر مسیر
  // ✅ قبلاً فقط به location.pathname وابسته بود و همیشه scrollTo({top:0})
  // می‌زد — یعنی لینک‌های لنگر (#hash)، مثل «حریم خصوصی» در فوتر که قرار
  // است مستقیم به یک بخش داخل /terms برود، همیشه بی‌اثر می‌شدند: چون هیچ‌جای
  // اپ رفتار native مرورگر برای اسکرول به #id را در SPA بازسازی نمی‌کرد و
  // این افکت هم هر بار زور می‌زد به بالای صفحه برگردد.
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // یک تیک صبر می‌کنیم تا محتوای صفحه‌ی جدید (lazy-loaded) رندر شود.
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);

  // تأیید نشست، یک بار در هر بار بالا آمدن اپ.
  //
  // isAuthenticated از localStorage برمی‌گردد ولی چیزی را ثابت نمی‌کند. بدون
  // این بررسی، اپ بعد از refresh خودش را لاگین فرض می‌کرد و اولین درخواست با
  // ۴۰۱ کاربر را با پیام «نشست شما منقضی شده است» بیرون می‌انداخت. حالا کوکی
  // نشست تعیین می‌کند، نه یک flag ذخیره‌شده.
  useEffect(() => {
    void useAuthStore.getState().checkAuth();
  }, []);

  // ✅ Referral System Phase 2: روی location.search (نه فقط mount) چون
  // این پروژه route اختصاصی «/register» ندارد — ثبت‌نام از هر صفحه‌ای
  // ممکن است شروع شود، پس ?ref= باید هرجا در URL ظاهر شد capture شود، نه
  // فقط یک‌بار در بارگذاری اول اپ.
  useEffect(() => {
    captureReferralFromLocation(location.search);
  }, [location.search]);

  return (
    <AppErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
        {/* تنظیمات اعلان‌ها (Toaster) */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={12}
          containerStyle={{ direction: 'rtl' }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              fontFamily: "'Vazirmatn', 'Tahoma', 'Arial', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              direction: 'rtl',
              padding: '16px 20px',
              maxWidth: '420px',
              minWidth: '320px',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10b981', secondary: '#ffffff' },
              style: {
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                color: '#065f46',
                border: '1px solid #86efac',
              },
            },
            error: {
              duration: 5000,
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
              style: {
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                color: '#991b1b',
                border: '1px solid #fca5a5',
              },
            },
            // ✅ react-hot-toast از نوع toast «warning» پشتیبانی نمی‌کند
            // (فقط success/error/loading/blank دارد) و هیچ‌جای کد هم
            // toast.warning(...) صدا زده نمی‌شد — این پیکربندی مرده بود و
            // خطای تایپ DefaultToastOptions هم تولید می‌کرد.
            loading: {
              duration: Infinity,
              style: {
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                color: '#475569',
                border: '1px solid #cbd5e1',
              },
            },
          }}
        />

        {/* هدر سایت (فقط در صفحات خاص مخفی می‌شود) */}
        {!hideLayout && <Header />}

        {/* محتوای اصلی صفحات */}
        <main className="flex-1 w-full">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ---------------------------------------------------- */}
              {/* روت‌های عمومی سایت */}
              {/* ---------------------------------------------------- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              {/* ✅ صفحه مقایسه محصولات - از CompareBar قابل دسترسی
                  مطابق سند مرجع ازکالا بخش ۸ Marketplace Components */}
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/brands" element={<BrandsPage />} />
              {/* ✅ قبلاً این صفحه کامل احراز هویت (OTP + ایمیل/رمز) در App.tsx
                  ایمپورت شده بود ولی هیچ <Route> ای برایش تعریف نشده بود؛
                  isAuthPage هم صراحتاً مسیر /auth را برای مخفی کردن هدر/فوتر
                  در نظر گرفته بود، یعنی این صفحه هرگز قابل‌دسترس نبود. */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/seller-request" element={<SellerRequestPage />} />
              <Route path="/seller-login" element={<SellerLoginPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/guarantee" element={<GuaranteePage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/seller-agreement" element={<SellerAgreementPage />} />
              <Route path="/magazine" element={<MagazinePage />} />
              <Route path="/magazine/:slug" element={<MagazineArticlePage />} />
              
              {/* ✅ روت صفحه عمومی فروشگاه (با هدر و فوتر اصلی سایت) */}
              {/* ✅ روت صفحه عمومی فروشگاه (با هدر و فوتر اصلی سایت) */}
<Route path="/seller/:slug" element={
  <Suspense fallback={<PageLoader />}>
    <SellerPage />
  </Suspense>
} />

              {/* ---------------------------------------------------- */}
              {/* روت‌های نیازمند احراز هویت کاربری */}
              {/* ---------------------------------------------------- */}
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
              <Route path="/user/tickets" element={<ProtectedRoute><UserTicketsPage /></ProtectedRoute>} />

              {/* ---------------------------------------------------- */}
              {/* روت‌های داشبورد کاربری */}
              {/* ---------------------------------------------------- */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard/profile" replace />} />
                <Route path="profile" element={<ProfileSection />} />
                <Route path="orders" element={<OrdersSection />} />
                <Route path="wishlist" element={<WishlistSection />} />
                <Route path="addresses" element={<AddressesSection />} />
                <Route path="devices" element={<DevicesSection />} />
<Route path="alerts" element={<AlertsSection />} />
<Route path="security" element={<SecuritySection />} />
                <Route path="notifications" element={<NotificationsSection />} />
                <Route path="tickets" element={<TicketsSection />} />
              </Route>

              {/* ریدایرکت‌های قدیمی به داشبورد جدید */}
              <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
              <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
              <Route path="/wishlist" element={<Navigate to="/dashboard/wishlist" replace />} />

              {/* ---------------------------------------------------- */}
              {/* روت‌های پنل فروشندگان (خصوصی) */}
              {/* ---------------------------------------------------- */}
              <Route path="/seller" element={
                <ProtectedRoute requireSeller redirectTo="/seller-login">
                  <SellerLayout />
                </ProtectedRoute>
              }>
                <Route index element={<SellerDashboard />} />
                <Route path="settings" element={<SellerSettings />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="products/:productId/edit" element={<SellerProducts />} />
                <Route path="products/templates" element={<ProductTemplatesPage />} />
                <Route path="products/new" element={<AddProduct />} />
                <Route path="products/:productId/edit" element={<EditProduct />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="orders/:orderId" element={<SellerOrderDetail />} />
                <Route path="payouts" element={<SellerPayouts />} />
                <Route path="chat" element={<SellerChatPage />} />
              </Route>

              {/* ---------------------------------------------------- */}
              {/* روت‌های پنل ادمین */}
              {/* ---------------------------------------------------- */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="catalog" element={<AdminCatalogPage />} />
                <Route path="device-brands" element={<AdminDeviceBrandsPage />} />
                <Route path="device-series" element={<AdminDeviceSeriesPage />} />
                <Route path="device-models" element={<AdminDeviceModelsPage />} />
                <Route path="magazine" element={<AdminMagazinePage />} /> 
                                <Route path="ads" element={<AdminAdsPage />} />
                
                {/* ریدایرکت‌های ادمین */}
                <Route path="categories" element={<Navigate to="/admin/catalog" replace />} />
                <Route path="brands" element={<Navigate to="/admin/catalog" replace />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="communication" element={<AdminCommunicationPage />} />
                <Route path="access" element={<AdminAccessPage />} />
                <Route path="chat/monitor" element={<Navigate to="/admin/communication" replace />} />
                <Route path="chat/reports" element={<Navigate to="/admin/communication" replace />} />
                <Route path="chat/sentiment" element={<Navigate to="/admin/communication" replace />} />
                <Route path="chat/blocks" element={<Navigate to="/admin/communication" replace />} />
                <Route path="chat/faq" element={<Navigate to="/admin/communication" replace />} />
                <Route path="chat/templates" element={<Navigate to="/admin/communication" replace />} />
                <Route path="chat/suggestions" element={<Navigate to="/admin/communication" replace />} />
                <Route path="support/tickets" element={<Navigate to="/admin/communication" replace />} />
              </Route>

              {/* ---------------------------------------------------- */}
              {/* روت پیش‌فرض (صفحه ۴۰۴) */}
              {/* ---------------------------------------------------- */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* فوتر سایت (فقط در صفحات خاص مخفی می‌شود) */}
        {!hideLayout && <Footer />}

        {/* کامپوننت‌های شناور و سراسری (Lazy Loaded)
    - فقط وقتی کاربر با آنها تعامل می‌کند بارگذاری می‌شوند
    - fallback=null چون تا زمانی که کاربر trigger نکند، چیزی نباید نمایش داده شود */}
<Suspense fallback={null}>
  <CartDrawer onCheckout={() => navigate('/checkout')} />
  <ModelSelectorModal />
  <ChatWidget />
  <AuthModal />
</Suspense>

        {/* ✅ CompareBar - نوار مقایسه محصولات (فقط در صفحات عمومی)
            - در admin، seller private و auth pages مخفی می‌شود
            - خودش بررسی می‌کند که products.length > 0 باشد
            - position: fixed bottom، پس در هر viewport دیده می‌شود */}
        {!hideLayout && (
          <Suspense fallback={null}>
            <CompareBar />
          </Suspense>
        )}
      </div>
    </AppErrorBoundary>
  );
}