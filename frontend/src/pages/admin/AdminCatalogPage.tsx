import { useState } from 'react';
import { Package, Award, FolderTree } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdminBrandsPage } from './AdminBrandsPage';
import { AdminCategoriesPage } from './AdminCategoriesPage';

type TabType = 'categories' | 'brands';

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

  const tabs = [
    {
      id: 'categories' as TabType,
      label: 'دسته‌بندی‌ها',
      icon: FolderTree,
      count: null, // می‌توانیم بعداً از API بگیریم
      color: 'primary',
    },
    {
      id: 'brands' as TabType,
      label: 'برندها',
      icon: Award,
      count: null,
      color: 'accent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            مدیریت کاتالوگ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت دسته‌بندی‌ها و برندهای محصولات
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all',
                  isActive
                    ? tab.color === 'primary'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                      : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/30'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    isActive ? 'bg-white/20' : 'bg-gray-200'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'categories' && <AdminCategoriesPage />}
        {activeTab === 'brands' && <AdminBrandsPage />}
      </div>
    </div>
  );
}