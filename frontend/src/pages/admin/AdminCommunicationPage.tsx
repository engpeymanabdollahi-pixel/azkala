import { useState } from 'react';
import { MessageCircle, Ticket, Smile, HelpCircle, FileText, Lightbulb, Flag, Ban } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdminChatMonitorPage } from './AdminChatMonitorPage';
import AdminSupportTicketsPage from './AdminSupportTicketsPage';
import { AdminSentimentDashboard } from './AdminSentimentDashboard';
import { AdminFaqManagementPage } from './AdminFaqManagementPage';
import { AdminMessageTemplatesPage } from './AdminMessageTemplatesPage';
import { AdminSuggestionManagementPage } from './AdminSuggestionManagementPage';
import { AdminChatReportsPage } from './AdminChatReportsPage';
import { AdminBlocksPage } from './AdminBlocksPage';

type TabType = 'chat' | 'tickets' | 'sentiment' | 'faq' | 'templates' | 'suggestions' | 'reports' | 'blocks';
type TabColor = 'primary' | 'warning' | 'accent' | 'success' | 'gray' | 'error';

export function AdminCommunicationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // ✅ AdminChatReportsPage و AdminBlocksPage قبلاً در App.tsx لود می‌شدند و
  // حتی روت‌های قدیمی‌شان (/admin/chat/reports و /admin/chat/blocks) به این
  // هاب ریدایرکت می‌شدند، اما هیچ تبی برای نمایش‌شان اینجا وجود نداشت —
  // یعنی دو صفحهٔ کامل «گزارش‌های تخلف چت» و «بلاک کاربران» برای ادمین
  // کاملاً غیرقابل‌دسترس بودند.
  const tabs: { id: TabType; label: string; icon: typeof MessageCircle; color: TabColor; description: string }[] = [
    {
      id: 'chat',
      label: 'چت زنده',
      icon: MessageCircle,
      color: 'primary',
      description: 'مانیتورینگ و مدیریت چت‌ها',
    },
    {
      id: 'reports',
      label: 'گزارش‌های تخلف',
      icon: Flag,
      color: 'error',
      description: 'بررسی و رسیدگی به گزارش‌های تخلف در چت',
    },
    {
      id: 'blocks',
      label: 'بلاک کاربران',
      icon: Ban,
      color: 'gray',
      description: 'مدیریت کاربران بلاک‌شده در چت',
    },
    {
      id: 'tickets',
      label: 'تیکت‌ها',
      icon: Ticket,
      color: 'warning',
      description: 'مدیریت تیکت‌های پشتیبانی',
    },
    {
      id: 'sentiment',
      label: 'تحلیل احساسات',
      icon: Smile,
      color: 'accent',
      description: 'داشبورد احساسات کاربران',
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: HelpCircle,
      color: 'success',
      description: 'مدیریت سوالات متداول',
    },
    {
      id: 'templates',
      label: 'قالب‌های پیام',
      icon: FileText,
      color: 'gray',
      description: 'مدیریت قالب‌های پاسخ سریع',
    },
    {
      id: 'suggestions',
      label: 'پیشنهادات',
      icon: Lightbulb,
      color: 'warning',
      description: 'مدیریت پیشنهادات هوشمند',
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const colorTextClasses: Record<TabColor, string> = {
    primary: 'text-primary-600 dark:text-primary-400',
    warning: 'text-warning-600 dark:text-warning-400',
    accent: 'text-accent-600 dark:text-accent-400',
    success: 'text-success-600 dark:text-success-400',
    gray: 'text-gray-600 dark:text-gray-400',
    error: 'text-error-600 dark:text-error-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            مدیریت ارتباطات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت چت، تیکت‌ها و ابزارهای ارتباطی
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            const colorClasses: Record<TabColor, string> = {
              primary: isActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20',
              warning: isActive ? 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md shadow-warning-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-warning-50 dark:hover:bg-warning-900/20',
              accent: isActive ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-accent-900/20',
              success: isActive ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-md shadow-success-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-success-50 dark:hover:bg-success-900/20',
              gray: isActive ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md shadow-gray-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50',
              error: isActive ? 'bg-gradient-to-r from-error-500 to-error-600 text-white shadow-md shadow-error-500/30' : 'text-gray-600 dark:text-gray-300 hover:bg-error-50 dark:hover:bg-error-900/20',
            };

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg text-xs font-bold transition-all',
                  colorClasses[tab.color]
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      {activeTabData && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
              <activeTabData.icon className={cn('w-5 h-5', colorTextClasses[activeTabData.color])} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{activeTabData.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{activeTabData.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'chat' && <AdminChatMonitorPage />}
        {activeTab === 'reports' && <AdminChatReportsPage />}
        {activeTab === 'blocks' && <AdminBlocksPage />}
        {activeTab === 'tickets' && <AdminSupportTicketsPage />}
        {activeTab === 'sentiment' && <AdminSentimentDashboard />}
        {activeTab === 'faq' && <AdminFaqManagementPage />}
        {activeTab === 'templates' && <AdminMessageTemplatesPage />}
        {activeTab === 'suggestions' && <AdminSuggestionManagementPage />}
      </div>
    </div>
  );
}
export default AdminCommunicationPage;
