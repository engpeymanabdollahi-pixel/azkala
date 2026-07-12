// src/App.tsx - ظ†ط³ط®ظ‡ ط¨ظ‡غŒظ†ظ‡ ط¨ط§ Lazy Loading (ظپط§ط² غ³.غ¶)
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/Footer';
import { ModelSelectorModal } from '@/components/features/ModelSelector/ModelSelectorModal';
import { CartDrawer } from '@/components/features/CartDrawer';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًں”„ Loading Component (ظ†ظ…ط§غŒط´ ظ‡ظ†ع¯ط§ظ… ظ„ظˆط¯ ط´ط¯ظ† طµظپط­ط§طھ Lazy)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">ط¯ط± ط­ط§ظ„ ط¨ط§ط±ع¯ط°ط§ط±غŒ...</p>
      </div>
    </div>
  );
}

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًں› ï¸ڈ ظ¾ظ†ظ„ ط§ط¯ظ…غŒظ† (Lazy Loaded - ظپظ‚ط· ظˆظ‚طھغŒ /admin ط¨ط§ط² ط´ظˆط¯)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));
const AdminBrandsPage = lazy(() => import('@/pages/admin/AdminBrandsPage').then(m => ({ default: m.AdminBrandsPage })));
const AdminCatalogPage = lazy(() => import('@/pages/admin/AdminCatalogPage').then(m => ({ default: m.AdminCatalogPage })));
const AdminCommunicationPage = lazy(() => import('@/pages/admin/AdminCommunicationPage').then(m => ({ default: m.AdminCommunicationPage })));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const AdminChatReportsPage = lazy(() => import('@/pages/admin/AdminChatReportsPage').then(m => ({ default: m.AdminChatReportsPage })));
const AdminChatMonitorPage = lazy(() => import('@/pages/admin/AdminChatMonitorPage').then(m => ({ default: m.AdminChatMonitorPage })));
const AdminSentimentDashboard = lazy(() => import('@/pages/admin/AdminSentimentDashboard').then(m => ({ default: m.AdminSentimentDashboard })));
const AdminBlocksPage = lazy(() => import('@/pages/admin/AdminBlocksPage').then(m => ({ default: m.AdminBlocksPage })));
const AdminFaqManagementPage = lazy(() => import('@/pages/admin/AdminFaqManagementPage').then(m => ({ default: m.AdminFaqManagementPage })));
const AdminMessageTemplatesPage = lazy(() => import('@/pages/admin/AdminMessageTemplatesPage').then(m => ({ default: m.AdminMessageTemplatesPage })));
const AdminSupportTicketsPage = lazy(() => import('@/pages/admin/AdminSupportTicketsPage').then(m => ({ default: m.AdminSupportTicketsPage })));
const AdminSuggestionManagementPage = lazy(() => import('@/pages/admin/AdminSuggestionManagementPage').then(m => ({ default: m.AdminSuggestionManagementPage })));

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًں‘¤ ط¯ط§ط´ط¨ظˆط±ط¯ غŒع©ظ¾ط§ط±ع†ظ‡ ع©ط§ط±ط¨ط± (Lazy Loaded)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
const UserDashboardLayout = lazy(() => import('@/components/layout/UserDashboardLayout').then(m => ({ default: m.UserDashboardLayout })));
const ProfileSection = lazy(() => import('@/pages/dashboard/ProfileSection').then(m => ({ default: m.ProfileSection })));
const OrdersSection = lazy(() => import('@/pages/dashboard/OrdersSection').then(m => ({ default: m.OrdersSection })));
const WishlistSection = lazy(() => import('@/pages/dashboard/WishlistSection').then(m => ({ default: m.WishlistSection })));
const AddressesSection = lazy(() => import('@/pages/dashboard/AddressesSection').then(m => ({ default: m.AddressesSection })));
const DevicesSection = lazy(() => import('@/pages/dashboard/DevicesSection').then(m => ({ default: m.DevicesSection })));
const SecuritySection = lazy(() => import('@/pages/dashboard/SecuritySection').then(m => ({ default: m.SecuritySection })));
const NotificationsSection = lazy(() => import('@/pages/dashboard/NotificationsSection').then(m => ({ default: m.NotificationsSection })));
const TicketsSection = lazy(() => import('@/pages/dashboard/TicketsSection').then(m => ({ default: m.TicketsSection })));

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًںڈھ طµظپط­ط§طھ ظپط±ظˆط´ظ†ط¯ظ‡ (Lazy Loaded)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
const SellerLayout = lazy(() => import('@/components/layout/SellerLayout').then(m => ({ default: m.SellerLayout })));
const SellerDashboard = lazy(() => import('@/pages/seller/SellerDashboard').then(m => ({ default: m.SellerDashboard })));
const SellerProducts = lazy(() => import('@/pages/seller/SellerProducts').then(m => ({ default: m.SellerProducts })));
const AddProduct = lazy(() => import('@/pages/seller/AddProduct').then(m => ({ default: m.AddProduct })));
const EditProduct = lazy(() => import('@/pages/seller/EditProduct').then(m => ({ default: m.EditProduct })));
const SellerOrders = lazy(() => import('@/pages/seller/SellerOrders').then(m => ({ default: m.SellerOrders })));
const SellerOrderDetail = lazy(() => import('@/pages/seller/SellerOrderDetail').then(m => ({ default: m.SellerOrderDetail })));
const SellerPayouts = lazy(() => import('@/pages/seller/SellerPayouts').then(m => ({ default: m.SellerPayouts })));
const SellerLogin = lazy(() => import('@/pages/seller/sellerlogin').then(m => ({ default: m.SellerLogin })));
const SellerChatPage = lazy(() => import('@/pages/seller/SellerChatPage').then(m => ({ default: m.SellerChatPage })));

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًںŒگ طµظپط­ط§طھ ط¹ظ…ظˆظ…غŒ (Lazy Loaded - طµظپط­ط§طھ ط³ظ†ع¯غŒظ†)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })));
const BrandsPage = lazy(() => import('@/pages/BrandsPage').then(m => ({ default: m.BrandsPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then(m => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const HelpPage = lazy(() => import('@/pages/HelpPage').then(m => ({ default: m.HelpPage })));
const GuaranteePage = lazy(() => import('@/pages/GuaranteePage').then(m => ({ default: m.GuaranteePage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const UserTicketsPage = lazy(() => import('@/pages/user/UserTicketsPage').then(m => ({ default: m.UserTicketsPage })));

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًں”’ ع©ط§ظ…ظ¾ظˆظ†ظ†طھ ظ…ط­ط§ظپط¸طھâ€Œط´ط¯ظ‡
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSeller && user?.role !== 'seller') {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًںژ¯ ع©ط§ظ…ظ¾ظˆظ†ظ†طھ ط§طµظ„غŒ
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // ظ…ط®ظپغŒ ع©ط±ط¯ظ† ظ‡ط¯ط± ظˆ ظپظˆطھط± ط¨ط±ط§غŒ ظ…ط³غŒط±ظ‡ط§غŒ ط®ط§طµ
  const isSellerRoute = location.pathname.startsWith('/seller');
  const isAuthPage = location.pathname === '/auth';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideLayout = isSellerRoute || isAuthPage || isAdminRoute;

  // ط§ط³ع©ط±ظˆظ„ ط¨ظ‡ ط¨ط§ظ„ط§ ظ‡ظ†ع¯ط§ظ… طھط؛غŒغŒط± ظ…ط³غŒط±
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir="rtl">
      {/* ظ‡ط¯ط± */}
      {!hideLayout && <Header />}

      {/* ظ…ط­طھظˆط§غŒ ط§طµظ„غŒ */}
      <main className="flex-1 w-full">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
                ًںŒگ طµظپط­ط§طھ ط¹ظ…ظˆظ…غŒ
            â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/guarantee" element={<GuaranteePage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
                ًں”’ طµظپط­ط§طھ ظ…ط­ط§ظپط¸طھâ€Œط´ط¯ظ‡ ع©ط§ط±ط¨ط±
            â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            <Route path="/user/tickets" element={<ProtectedRoute><UserTicketsPage /></ProtectedRoute>} />

            {/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
                ًں‘¤ ط¯ط§ط´ط¨ظˆط±ط¯ غŒع©ظ¾ط§ط±ع†ظ‡ ع©ط§ط±ط¨ط±
            â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboardLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard/profile" replace />} />
              <Route path="profile" element={<ProfileSection />} />
              <Route path="orders" element={<OrdersSection />} />
              <Route path="wishlist" element={<WishlistSection />} />
              <Route path="addresses" element={<AddressesSection />} />
              <Route path="devices" element={<DevicesSection />} />
              <Route path="security" element={<SecuritySection />} />
              <Route path="notifications" element={<NotificationsSection />} />
              <Route path="tickets" element={<TicketsSection />} />
            </Route>

            {/* Redirect ط§ط² routes ظ‚ط¯غŒظ…غŒ ط¨ظ‡ ط¯ط§ط´ط¨ظˆط±ط¯ ط¬ط¯غŒط¯ */}
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
            <Route path="/wishlist" element={<Navigate to="/dashboard/wishlist" replace />} />

            {/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
                ًںڈھ طµظپط­ط§طھ ظپط±ظˆط´ظ†ط¯ظ‡
            â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <Route path="/seller-login" element={<SellerLogin />} />
            <Route path="/seller" element={
              <ProtectedRoute requireSeller redirectTo="/seller-login">
                <SellerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="products/new" element={<AddProduct />} />
              <Route path="products/:productId/edit" element={<EditProduct />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="orders/:orderId" element={<SellerOrderDetail />} />
              <Route path="payouts" element={<SellerPayouts />} />
              <Route path="chat" element={<SellerChatPage />} />
            </Route>

            {/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
                ًں› ï¸ڈ ظ¾ظ†ظ„ ط§ط¯ظ…غŒظ† (غŒع©ظ¾ط§ط±ع†ظ‡)
            â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              {/* ط¯ط§ط´ط¨ظˆط±ط¯ */}
              <Route index element={<AdminDashboard />} />

              {/* ظ…ط¯غŒط±غŒطھ ط§طµظ„غŒ */}
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
              
              {/* Redirect ط§ط² ظ…ط³غŒط±ظ‡ط§غŒ ظ‚ط¯غŒظ…غŒ */}
              <Route path="categories" element={<Navigate to="/admin/catalog" replace />} />
              <Route path="brands" element={<Navigate to="/admin/catalog" replace />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />

              {/* ط§ط±طھط¨ط§ط·ط§طھ (طھط¬ظ…غŒط¹ ط´ط¯ظ‡) */}
              <Route path="communication" element={<AdminCommunicationPage />} />

              {/* Redirect ط§ط² ظ…ط³غŒط±ظ‡ط§غŒ ظ‚ط¯غŒظ…غŒ */}
              <Route path="chat/monitor" element={<Navigate to="/admin/communication" replace />} />
              <Route path="chat/reports" element={<Navigate to="/admin/communication" replace />} />
              <Route path="chat/sentiment" element={<Navigate to="/admin/communication" replace />} />
              <Route path="chat/blocks" element={<Navigate to="/admin/communication" replace />} />
              <Route path="chat/faq" element={<Navigate to="/admin/communication" replace />} />
              <Route path="chat/templates" element={<Navigate to="/admin/communication" replace />} />
              <Route path="chat/suggestions" element={<Navigate to="/admin/communication" replace />} />
              <Route path="support/tickets" element={<Navigate to="/admin/communication" replace />} />
            </Route>

            {/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
                â‌Œ ظ…ط³غŒط± ظ†ط§ظ…ط¹طھط¨ط±
            â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* ع©ط´ظˆغŒ ط³ط¨ط¯ ط®ط±غŒط¯ */}
      <CartDrawer onCheckout={() => navigate('/checkout')} />

      {/* ظپظˆطھط± */}
      {!hideLayout && <Footer />}

      {/* ظ…ظˆط¯ط§ظ„ ط§ظ†طھط®ط§ط¨ ع¯ظˆط´غŒ */}
      <ModelSelectorModal />

      {/* ظˆغŒط¬طھ ع†طھ */}
      <ChatWidget />

      {/* ظ†ظˆطھغŒظپغŒع©غŒط´ظ†â€Œظ‡ط§ */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerStyle={{ direction: 'rtl' }}
        toastOptions={{
          className: '',
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
          warning: {
            duration: 4000,
            iconTheme: { primary: '#f59e0b', secondary: '#ffffff' },
            style: {
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              color: '#92400e',
              border: '1px solid #fcd34d',
            },
          },
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
    </div>
  );
}