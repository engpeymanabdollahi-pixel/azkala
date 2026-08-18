import { useState } from 'react';
import { Package, Award, FolderTree, Smartphone, Layers, Box, Watch } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdminBrandsPage } from './AdminBrandsPage';
import { AdminCategoriesPage } from './AdminCategoriesPage';
import { AdminDeviceFamiliesPage } from './AdminDeviceFamiliesPage';
import { AdminDeviceBrandsPage } from './AdminDeviceBrandsPage';
import { AdminDeviceSeriesPage } from './AdminDeviceSeriesPage';
import { AdminDeviceModelsPage } from './AdminDeviceModelsPage';

type TabType = 'categories' | 'brands' | 'device-families' | 'device-brands' | 'device-series' | 'device-models';

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

    const tabs = [
    {
      id: 'categories' as TabType,
      label: 'دسته‌بندی محصولات', // مدیریت درخت دسته‌بندی‌های سایت
      icon: FolderTree,
      color: 'primary',
    },
    {
      id: 'brands' as TabType,
      label: 'برندهای فروشگاهی', // ✅ برندِ تولیدکننده‌ی خودِ کالا (مثل Spigen, Anker)
      icon: Award,
      color: 'accent',
    },
    {
      id: 'device-families' as TabType,
      label: 'خانواده‌های دستگاه', // ✅ Device-First: مرز اکوسیستم (Smartphone/Laptop/Tablet/...)
      icon: Watch,
      color: 'accent',
    },
    {
      id: 'device-brands' as TabType,
      label: 'برندهای دستگاه‌ها', // ✅ برندِ گوشی/لپ‌تاپِ مشتری (مثل Apple, Samsung)
      icon: Smartphone,
      color: 'success',
    },
    {
      id: 'device-series' as TabType,
      label: 'سری‌های دستگاه', // ✅ زیرمجموعه برند دستگاه (مثل iPhone, Galaxy)
      icon: Layers,
      color: 'warning',
    },
    {
      id: 'device-models' as TabType,
      label: 'مدل‌های دستگاه', // ✅ مدل دقیق (مثل iPhone 13, Galaxy S23)
      icon: Box,
      color: 'info',
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'categories':
        return <AdminCategoriesPage />;
      case 'brands':
        return <AdminBrandsPage />;
      case 'device-families':
        return <AdminDeviceFamiliesPage />;
      case 'device-brands':
        return <AdminDeviceBrandsPage />;
      case 'device-series':
        return <AdminDeviceSeriesPage />;
      case 'device-models':
        return <AdminDeviceModelsPage />;
      default:
        return <AdminCategoriesPage />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            مدیریت کاتالوگ
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت دسته‌بندی‌ها، برندها و سلسله‌مراتب دستگاه‌ها
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            // تعیین رنگ‌ها بر اساس وضعیت فعال
            const getActiveClasses = () => {
              switch (tab.color) {
                case 'primary': return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30';
                case 'accent': return 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/30';
                case 'success': return 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-md shadow-success-500/30';
                case 'warning': return 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md shadow-warning-500/30';
                case 'info': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30';
                default: return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white';
              }
            };

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap',
                  isActive
                    ? getActiveClasses()
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {renderActiveTab()}
      </div>
    </div>
  );
}
export default AdminCatalogPage;
