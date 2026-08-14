import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Search, Save, Lock, Unlock, History, Download, Upload,
  RefreshCw, AlertTriangle, X, Eye, EyeOff,
  Globe, CreditCard, Truck, Percent, Bell, FileText, Server,
  Clock, Shield, TestTube, Megaphone, Award,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminSettingService, type Setting, type SettingValue } from '@/services/api/adminSetting.service';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { STORAGE_URL } from '@/lib/apiConfig';
import type { AxiosError } from 'axios';

// ==================== Types ====================
type TabType = 'general' | 'payment' | 'shipping' | 'tax' | 'commission' | 'notifications' | 'legal' | 'marketing' | 'system' | 'history';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

// ==================== Constants ====================
const TABS: TabConfig[] = [
  { id: 'general', label: 'عمومی', icon: Globe },
  { id: 'payment', label: 'پرداخت', icon: CreditCard },
  { id: 'shipping', label: 'ارسال', icon: Truck },
  { id: 'tax', label: 'مالیات', icon: Percent },
  // ✅ وزن‌ها/thresholdهای سیستم کمیسیون هوشمند فروشندگان (بازه‌ی
  // امتیاز→سطح→نرخ خودش در صفحه‌ی «کاربران» → جزئیات فروشنده مدیریت
  // می‌شود، نه اینجا — این تب فقط پارامترهای محاسبه‌ی Score است).
  { id: 'commission', label: 'کمیسیون فروشندگان', icon: Award },
  { id: 'notifications', label: 'اطلاع‌رسانی', icon: Bell },
  { id: 'legal', label: 'قوانین', icon: FileText },
  // ✅ گروه marketing (نوار اطلاع‌رسانی بالای هدر) قبلاً هیچ تبی نداشت —
  // تنظیماتش (announcement_*) هرگز حتی در دیتابیس seed نمی‌شد (رجوع کنید
  // به config/azkala/settings_defaults.php) چون یک فایل تنظیمات دیگر با
  // همین نام مسیر، بی‌صدا آن را کنار می‌زد؛ الان هم آن باگ رفع شده و هم
  // این تب واقعاً به همان تنظیمات وصل است.
  { id: 'marketing', label: 'بازاریابی', icon: Megaphone },
  { id: 'system', label: 'سیستمی', icon: Server },
  { id: 'history', label: 'تاریخچه', icon: History },
];

// ==================== Main Component ====================
export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [changes, setChanges] = useState<Record<string, SettingValue>>({});

  // ==================== Queries ====================
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingService.getSettings(),
    staleTime: 1000 * 60 * 5,       // ۵ دقیقه
    gcTime: 1000 * 60 * 30,         // ۳۰ دقیقه
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const settings = data?.data?.settings || {};
  const stats = data?.data?.stats;
  const currentGroupSettings = settings?.[activeTab] || [];

  // فیلتر کردن تنظیمات بر اساس جستجو
  const filteredSettings = currentGroupSettings.filter(s =>
    !searchQuery ||
    s.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== Mutations ====================
  const saveMutation = useMutation({
    mutationFn: ({ group, settings: items }: { group: string; settings: Array<{ key: string; value: SettingValue }> }) =>
      adminSettingService.updateGroup(group, items),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      // ✅ بدون این خط، بخش عمومی سایت (فوتر، نوار اطلاع‌رسانی هدر و...) که
      // از /site-settings می‌خواند تا ۵ دقیقه (staleTime همان کوئری) مقدار
      // قدیمی را نشان می‌داد، با اینکه ذخیره در پنل ادمین موفق بود.
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success(response.message || 'تنظیمات با موفقیت ذخیره شد', { icon: '✅' });
      setChanges({});
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'خطا در ذخیره‌سازی تنظیمات');
    },
  });

  const lockMutation = useMutation({
    mutationFn: (key: string) => adminSettingService.toggleLock(key),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(response.message, { icon: '🔒' });
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: () => adminSettingService.testSmtp(),
    onSuccess: (response) => toast.success(response.message, { icon: '📧' }),
    onError: () => toast.error('خطا در برقراری ارتباط با سرور SMTP'),
  });

  const testSmsMutation = useMutation({
    mutationFn: () => adminSettingService.testSms(),
    onSuccess: (response) => toast.success(response.message, { icon: '📱' }),
    onError: () => toast.error('خطا در برقراری ارتباط با پنل پیامک'),
  });

  const seedMutation = useMutation({
    mutationFn: () => adminSettingService.seedDefaults(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(response.message, { icon: '✅' });
    },
  });

  // ==================== Handlers ====================
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setChanges({});
    setSearchQuery(''); // ✅ حل ریشه‌ای باگ خالی بودن تب‌ها: پاک کردن جستجو هنگام تغییر تب
  };

  const handleValueChange = (key: string, value: SettingValue) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (Object.keys(changes).length === 0) {
      toast.error('هیچ تغییری برای ذخیره وجود ندارد');
      return;
    }
    const settingsToUpdate = Object.entries(changes).map(([key, value]) => ({ key, value }));
    saveMutation.mutate({ group: activeTab, settings: settingsToUpdate });
  };

  const handleExport = async () => {
    try {
      const response = await adminSettingService.export(activeTab);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `azkala-settings-${activeTab}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('فایل تنظیمات با موفقیت دانلود شد', { icon: '📥' });
    } catch {
      toast.error('خطا در ایجاد فایل خروجی');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = parsed.settings || parsed;
      if (!Array.isArray(items)) throw new Error('فرمت فایل نامعتبر است');

      const response = await adminSettingService.import(items);
      toast.success(response.message, { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فرمت فایل نامعتبر است';
      toast.error('خطا در وارد کردن فایل: ' + message);
    }
    event.target.value = ''; // Reset input
  };

  const hasChanges = Object.keys(changes).length > 0;
  const changesCount = Object.keys(changes).length;
  const isSearching = searchQuery.trim().length > 0;

  // ==================== Render ====================
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Settings className="w-6 h-6 text-white" />
            </div>
            تنظیمات سایت
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            مدیریت پیکربندی کلی و پارامترهای پلتفرم ازکالا
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-primary-500" />
                <span className="font-bold">{stats.total}</span> تنظیم
              </span>
              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700" />
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-warning-500" />
                <span className="font-bold">{stats.locked}</span> قفل
              </span>
              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent-500" />
                <span className="font-bold">{stats.today_changes}</span> تغییر امروز
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', seedMutation.isPending && 'animate-spin')} />
            مقداردهی اولیه
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="جستجو در تنظیمات (بر اساس نام یا کلید)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'history' ? (
        <HistoryTab />
      ) : (
        <div className="space-y-4">
          {/* ✅ پیش‌نمایش زنده‌ی نوار اطلاع‌رسانی — از همان کامپوننت واقعی
              هدر (AnnouncementBar) استفاده می‌کند، پس دقیقاً همان چیزی را
              نشان می‌دهد که کاربر نهایی می‌بیند. بر اساس آخرین نسخه‌ی
              ذخیره‌شده است، نه پیش‌نویس فعلی — بعد از «ذخیره تغییرات»
              بلافاصله به‌روز می‌شود. */}
          {activeTab === 'marketing' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700">
                <Megaphone className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">پیش‌نمایش زنده (بر اساس آخرین ذخیره)</span>
              </div>
              <AnnouncementBar />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-3">
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="warning" className="animate-pulse-soft">
                  {changesCount} تغییر ذخیره نشده
                </Badge>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                گروه فعال: <strong className="text-gray-900 dark:text-white">{TABS.find(t => t.id === activeTab)?.label}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                <Download className="w-4 h-4" />
                خروجی
              </Button>

              <label className="cursor-pointer">
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  ورودی
                </span>
              </label>

              {activeTab === 'notifications' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => testSmtpMutation.mutate()} disabled={testSmtpMutation.isPending} className="gap-1.5">
                    <TestTube className="w-4 h-4" />
                    تست ایمیل
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => testSmsMutation.mutate()} disabled={testSmsMutation.isPending} className="gap-1.5">
                    <TestTube className="w-4 h-4" />
                    تست پیامک
                  </Button>
                </>
              )}

              <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} isLoading={saveMutation.isPending} className="gap-2 min-w-[140px]">
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </Button>
            </div>
          </div>

          {/* Settings List */}
          {isLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredSettings.length === 0 ? (
            <EmptyState
              icon={<Search className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
              title={isSearching ? 'موردی یافت نشد' : 'تنظیمی یافت نشد'}
              description={
                isSearching 
                  ? `هیچ تنظیمی با عبارت "${searchQuery}" در تب "${TABS.find(t => t.id === activeTab)?.label}" مطابقت ندارد.`
                  : 'برای ایجاد تنظیمات پیش‌فرض، روی دکمه "مقداردهی اولیه" در بالای صفحه کلیک کنید.'
              }
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden">
              {filteredSettings.map((setting) => (
                <SettingRow
                  key={setting.id}
                  setting={setting}
                  currentValue={changes[setting.key] !== undefined ? changes[setting.key] : setting.value}
                  onChange={(value) => handleValueChange(setting.key, value)}
                  onToggleLock={() => lockMutation.mutate(setting.key)}
                  isChanged={changes[setting.key] !== undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Save Bar (Mobile/Desktop) */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3 flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2 px-2">
            <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {changesCount} تغییر ذخیره نشده
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setChanges({})} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              انصراف
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} isLoading={saveMutation.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              ذخیره
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Sub-Components ====================

function SettingRow({
  setting,
  currentValue,
  onChange,
  onToggleLock,
  isChanged,
}: {
  setting: Setting;
  currentValue: SettingValue;
  onChange: (value: SettingValue) => void;
  onToggleLock: () => void;
  isChanged: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  // مقادیر boolean/File برای این ورودی‌های متنی معنا ندارند؛ فقط برای نوع‌های
  // text/number/color/textarea/email/url استفاده می‌شود.
  const textValue = (value: SettingValue): string | number =>
    typeof value === 'string' || typeof value === 'number' ? value : '';

  const renderInput = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue === true || currentValue === '1' || currentValue === 1 || currentValue === 'true'}
              onChange={(e) => onChange(e.target.checked ? '1' : '0')}
              disabled={setting.is_locked}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 dark:peer-focus:ring-primary-900/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 dark:bg-slate-700 dark:peer-checked:bg-primary-500"></div>
          </label>
        );

      case 'file':
      case 'image':
        return (
          <FileUploadInput
            currentValue={currentValue}
            onChange={onChange}
            isLocked={setting.is_locked}
            label={setting.label || setting.key}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={textValue(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={typeof currentValue === 'string' ? currentValue : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              disabled={setting.is_locked}
              className="w-12 h-10 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer disabled:opacity-50 bg-transparent"
            />
            <input
              type="text"
              value={textValue(currentValue)}
              onChange={(e) => onChange(e.target.value)}
              disabled={setting.is_locked}
              dir="ltr"
              className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-50 transition-all"
            />
          </div>
        );

      case 'textarea':
        // ✅ فیلدهای حقوقی (terms_text/privacy_text/warranty_text/
        // seller_terms_text) می‌توانند کل متن یک سند طولانی باشند —
        // rows={3} و resize-none قبلی برای این نوع محتوا کاملاً ناکافی بود.
        return (
          <textarea
            value={textValue(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            rows={setting.group === 'legal' ? 10 : 3}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 resize-y disabled:opacity-50 transition-all"
          />
        );

      case 'email':
      case 'url':
      default:
        if (setting.is_sensitive) {
          return (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={textValue(currentValue)}
                onChange={(e) => onChange(e.target.value)}
                disabled={setting.is_locked}
                dir="ltr"
                className="w-full px-3 py-2.5 pl-10 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          );
        }
        return (
          <input
            type="text"
            value={textValue(currentValue)}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            dir="ltr"
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-50 transition-all"
          />
        );
    }
  };

  return (
    <div className={cn(
      'p-5 transition-all duration-200',
      isChanged && 'bg-primary-50/40 dark:bg-primary-900/10',
      setting.is_locked && 'bg-gray-50/50 dark:bg-slate-800/50'
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <label className="text-sm font-bold text-gray-900 dark:text-white">
              {setting.label || setting.key}
            </label>
            {setting.is_locked && <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
            {setting.is_sensitive && <Shield className="w-3.5 h-3.5 text-warning-500" />}
            {isChanged && <Badge variant="warning" size="sm">تغییر کرده</Badge>}
          </div>
          
          {setting.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{setting.description}</p>
          )}
          
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mb-3 bg-gray-100 dark:bg-slate-800 inline-block px-2 py-0.5 rounded">
            {setting.key}
          </p>
          
          <div className="max-w-xl">
            {renderInput()}
          </div>
        </div>

        <button
          onClick={onToggleLock}
          className={cn(
            'p-2.5 rounded-xl transition-all flex-shrink-0',
            setting.is_locked
              ? 'bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:hover:bg-warning-900/30'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:hover:bg-slate-600'
          )}
          title={setting.is_locked ? 'باز کردن قفل' : 'قفل کردن'}
        >
          {setting.is_locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function FileUploadInput({ currentValue, onChange, isLocked, label }: {
  currentValue: SettingValue;
  onChange: (val: SettingValue) => void;
  isLocked: boolean;
  label: string;
}) {
  const [preview, setPreview] = useState<string | null>(
    typeof currentValue === 'string' && currentValue
      ? (currentValue.startsWith('http') ? currentValue : `${STORAGE_URL}/${currentValue.replace(/^storage\//, '')}`)
      : null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
    e.target.value = '';
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div 
        className={cn(
          "relative w-full h-36 bg-gray-50 dark:bg-slate-900 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
          isLocked 
            ? "border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 cursor-not-allowed" 
            : "border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 cursor-pointer"
        )}
        onClick={() => !isLocked && inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-contain rounded-lg p-3" />
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span className="text-xs font-medium">برای آپلود کلیک کنید</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLocked}
          className="hidden"
        />
      </div>
      
      {preview && !isLocked && (
        <Button type="button" variant="outline" size="sm" onClick={handleRemove} className="w-full text-error-600 border-error-200 hover:bg-error-50 dark:border-error-900/30 dark:hover:bg-error-900/20 gap-2">
          <X className="w-4 h-4" /> حذف تصویر فعلی
        </Button>
      )}
      
      {currentValue && typeof currentValue === 'string' && !selectedFile && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
          فایل فعلی: {currentValue.split('/').pop()}
        </p>
      )}
    </div>
  );
}

function HistoryTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterGroup, setFilterGroup] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings-history', page, filterGroup],
    queryFn: () => adminSettingService.getHistory(filterGroup || undefined, undefined, page),
  });

  const histories = data?.data?.histories || [];
  const pagination = data?.data?.pagination;

  const rollbackMutation = useMutation({
    mutationFn: (id: number) => adminSettingService.rollback(id),
    onSuccess: () => {
      toast.success('بازگشت به نسخه قبلی با موفقیت انجام شد', { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'خطا در عملیات بازگشت');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filterGroup}
          onChange={(e) => {
            setFilterGroup(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-all"
        >
          <option value="">همه گروه‌ها</option>
          {TABS.filter(t => t.id !== 'history').map(tab => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : histories.length === 0 ? (
          <EmptyState
            icon={<History className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
            title="تاریخچه‌ای وجود ندارد"
            description="هنوز تغییری در تنظیمات این گروه ثبت نشده است."
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {histories.map((history) => (
              <div key={history.id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="primary" size="sm">
                        {TABS.find(t => t.id === history.group)?.label || history.group}
                      </Badge>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {history.label || history.setting_key}
                      </span>
                      {history.note && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {history.note}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="bg-error-50 dark:bg-error-900/10 border border-error-100 dark:border-error-900/20 rounded-lg p-3">
                        <p className="text-[10px] text-error-700 dark:text-error-400 font-bold mb-1 uppercase tracking-wider">مقدار قبلی:</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 font-mono break-all">
                          {history.old_value || '(خالی)'}
                        </p>
                      </div>
                      <div className="bg-success-50 dark:bg-success-900/10 border border-success-100 dark:border-success-900/20 rounded-lg p-3">
                        <p className="text-[10px] text-success-700 dark:text-success-400 font-bold mb-1 uppercase tracking-wider">مقدار جدید:</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 font-mono break-all">
                          {history.new_value || '(خالی)'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {history.created_at}
                      </span>
                      {history.changed_by && (
                        <span className="flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5" />
                          {history.changed_by.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rollbackMutation.mutate(history.id)}
                    disabled={rollbackMutation.isPending}
                    className="gap-1.5 flex-shrink-0 mt-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    بازگشت
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              صفحه {pagination.current_page} از {pagination.last_page}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.current_page === 1}
              >
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page === pagination.last_page}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminSettingsPage;
