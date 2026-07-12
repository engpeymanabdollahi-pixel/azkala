import { useState } from 'react';
import { MessageCircle, Ticket, Smile, HelpCircle, FileText, Lightbulb } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdminChatMonitorPage } from './AdminChatMonitorPage';
import { AdminSupportTicketsPage } from './AdminSupportTicketsPage';
import { AdminSentimentDashboard } from './AdminSentimentDashboard';
import { AdminFaqManagementPage } from './AdminFaqManagementPage';
import { AdminMessageTemplatesPage } from './AdminMessageTemplatesPage';
import { AdminSuggestionManagementPage } from './AdminSuggestionManagementPage';

type TabType = 'chat' | 'tickets' | 'sentiment' | 'faq' | 'templates' | 'suggestions';

export function AdminCommunicationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const tabs = [
    {
      id: 'chat' as TabType,
      label: 'چت زنده',
      icon: MessageCircle,
      color: 'primary',
      description: 'مانیتورینگ و مدیریت چت‌ها',
    },
    {
      id: 'tickets' as TabType,
      label: 'تیکت‌ها',
      icon: Ticket,
      color: 'warning',
      description: 'مدیریت تیکت‌های پشتیبانی',
    },
    {
      id: 'sentiment' as TabType,
      label: 'تحلیل احساسات',
      icon: Smile,
      color: 'accent',
      description: 'داشبورد احساسات کاربران',
    },
    {
      id: 'faq' as TabType,
      label: 'FAQ',
      icon: HelpCircle,
      color: 'success',
      description: 'مدیریت سوالات متداول',
    },
    {
      id: 'templates' as TabType,
      label: 'قالب‌های پیام',
      icon: FileText,
      color: 'gray',
      description: 'مدیریت قالب‌های پاسخ سریع',
    },
    {
      id: 'suggestions' as TabType,
      label: 'پیشنهادات',
      icon: Lightbulb,
      color: 'warning',
      description: 'مدیریت پیشنهادات هوشمند',
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            مدیریت ارتباطات
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت چت، تیکت‌ها و ابزارهای ارتباطی
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            const colorClasses = {
              primary: isActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30' : 'text-gray-600 hover:bg-primary-50',
              warning: isActive ? 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md shadow-warning-500/30' : 'text-gray-600 hover:bg-warning-50',
              accent: isActive ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/30' : 'text-gray-600 hover:bg-accent-50',
              success: isActive ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-md shadow-success-500/30' : 'text-gray-600 hover:bg-success-50',
              gray: isActive ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md shadow-gray-500/30' : 'text-gray-600 hover:bg-gray-50',
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg text-xs font-bold transition-all',
                  colorClasses[tab.color as keyof typeof colorClasses]
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
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 border border-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <activeTabData.icon className={cn(
                'w-5 h-5',
                activeTabData.color === 'primary' && 'text-primary-600',
                activeTabData.color === 'warning' && 'text-warning-600',
                activeTabData.color === 'accent' && 'text-accent-600',
                activeTabData.color === 'success' && 'text-success-600',
                activeTabData.color === 'gray' && 'text-gray-600',
              )} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{activeTabData.label}</h3>
              <p className="text-sm text-gray-600">{activeTabData.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'chat' && <AdminChatMonitorPage />}
        {activeTab === 'tickets' && <AdminSupportTicketsPage />}
        {activeTab === 'sentiment' && <AdminSentimentDashboard />}
        {activeTab === 'faq' && <AdminFaqManagementPage />}
        {activeTab === 'templates' && <AdminMessageTemplatesPage />}
        {activeTab === 'suggestions' && <AdminSuggestionManagementPage />}
      </div>
    </div>
  );
}