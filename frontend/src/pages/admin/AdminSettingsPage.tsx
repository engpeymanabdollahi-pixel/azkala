import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Search, Save, Lock, Unlock, History, Download, Upload,
  RefreshCw, AlertTriangle, X, Eye, EyeOff,
  Globe, CreditCard, Truck, Percent, Bell, FileText, Server,
  Clock, Shield, TestTube,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminSettingService, type Setting } from '@/services/api/adminSetting.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type TabType = 'general' | 'payment' | 'shipping' | 'tax' | 'notifications' | 'legal' | 'system' | 'history';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'general', label: 'عمومی', icon: Globe },
  { id: 'payment', label: 'پرداخت', icon: CreditCard },
  { id: 'shipping', label: 'ارسال', icon: Truck },
  { id: 'tax', label: 'مالیات', icon: Percent },
  { id: 'notifications', label: 'اطلاع‌رسانی', icon: Bell },
  { id: 'legal', label: 'قوانین', icon: FileText },
  { id: 'system', label: 'سیستمی', icon: Server },
  { id: 'history', label: 'تاریخچه', icon: History },
];

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [changes, setChanges] = useState<Record<string, any>>({});

  // ==================== Queries ====================
  // ✅ فقط یک بار fetch شود (بدون activeTab در queryKey)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingService.getSettings(),
    staleTime: 1000 * 60 * 5,       // ۵ دقیقه fresh
    gcTime: 1000 * 60 * 30,         // ۳۰ دقیقه در cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const settings = data?.data?.settings || {};
  const stats = data?.data?.stats;
  const currentGroupSettings = settings?.[activeTab] || [];

  // ==================== Mutations ====================

  const saveMutation = useMutation({
    mutationFn: ({ group, settings: items }: { group: string; settings: any[] }) =>
      adminSettingService.updateGroup(group, items),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(response.message || 'تنظیمات ذخیره شد', { icon: '✅' });
      setChanges({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در ذخیره');
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
    onError: () => toast.error('خطا در تست SMTP'),
  });

  const testSmsMutation = useMutation({
    mutationFn: () => adminSettingService.testSms(),
    onSuccess: (response) => toast.success(response.message, { icon: '📱' }),
    onError: () => toast.error('خطا در تست پیامک'),
  });

  const seedMutation = useMutation({
    mutationFn: () => adminSettingService.seedDefaults(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(response.message, { icon: '✅' });
    },
  });

  // ==================== Handlers ====================

  const handleValueChange = (key: string, value: any) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (Object.keys(changes).length === 0) {
      toast.error('تغییری برای ذخیره وجود ندارد');
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
      a.download = `settings-${activeTab}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('فایل دانلود شد', { icon: '📥' });
    } catch {
      toast.error('خطا در خروجی');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = parsed.settings || parsed;
      if (!Array.isArray(items)) throw new Error('فرمت نامعتبر');

      const response = await adminSettingService.import(items);
      toast.success(response.message, { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch (error: any) {
      toast.error('خطا در وارد کردن: ' + error.message);
    }
    event.target.value = '';
  };

  const hasChanges = Object.keys(changes).length > 0;
  const changesCount = Object.keys(changes).length;

  // ==================== Render ====================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Settings className="w-5 h-5 text-white" />
            </div>
            تنظیمات سایت
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت تنظیمات کلی پلتفرم ازکالا
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats && (
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-100">
              <span className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                {stats.total} تنظیم
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {stats.locked} قفل
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {stats.today_changes} تغییر امروز
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="gap-1.5"
          >
            <RefreshCw className={cn('w-4 h-4', seedMutation.isPending && 'animate-spin')} />
            مقداردهی اولیه
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو در تنظیمات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setChanges({});
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'history' ? (
        <HistoryTab />
      ) : (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="warning">
                  {changesCount} تغییر ذخیره نشده
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                گروه: <strong>{TABS.find(t => t.id === activeTab)?.label}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
                <Download className="w-3.5 h-3.5" />
                خروجی
              </Button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">
                  <Upload className="w-3.5 h-3.5" />
                  ورودی
                </span>
              </label>

              {activeTab === 'notifications' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSmtpMutation.mutate()}
                    disabled={testSmtpMutation.isPending}
                    className="gap-1"
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    تست ایمیل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSmsMutation.mutate()}
                    disabled={testSmsMutation.isPending}
                    className="gap-1"
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    تست پیامک
                  </Button>
                </>
              )}

              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
                isLoading={saveMutation.isPending}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </Button>
            </div>
          </div>

          {/* Settings List */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : currentGroupSettings.length === 0 ? (
            <EmptyState
              icon={<Settings className="w-12 h-12" />}
              title="تنظیمی یافت نشد"
              description="روی 'مقداردهی اولیه' کلیک کنید"
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
              {currentGroupSettings
                .filter(s =>
                  !searchQuery ||
                  s.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.key.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((setting) => (
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

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 flex items-center gap-3 animate-slide-up">
          <div className="flex items-center gap-2 px-3">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            <span className="text-sm font-bold text-gray-900">
              {changesCount} تغییر ذخیره نشده
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChanges({})}
          >
            انصراف
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            isLoading={saveMutation.isPending}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            ذخیره
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== Setting Row ====================

function SettingRow({
  setting,
  currentValue,
  onChange,
  onToggleLock,
  isChanged,
}: {
  setting: Setting;
  currentValue: any;
  onChange: (value: any) => void;
  onToggleLock: () => void;
  isChanged: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentValue || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              disabled={setting.is_locked}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer disabled:opacity-50"
            />
            <input
              type="text"
              value={currentValue || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={setting.is_locked}
              dir="ltr"
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50"
            />
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            rows={3}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white resize-none disabled:opacity-50"
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            dir="ltr"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            dir="ltr"
            placeholder="https://"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50"
          />
        );

      default:
        if (setting.is_sensitive) {
          return (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentValue || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={setting.is_locked}
                dir="ltr"
                className="w-full px-3 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          );
        }
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={setting.is_locked}
            dir="ltr"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50"
          />
        );
    }
  };

  return (
    <div className={cn(
      'p-4 transition-all',
      isChanged && 'bg-primary-50/30',
      setting.is_locked && 'bg-gray-50/50'
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-bold text-gray-900">
              {setting.label || setting.key}
            </label>
            {setting.is_locked && <Lock className="w-3 h-3 text-gray-400" />}
            {setting.is_sensitive && <Shield className="w-3 h-3 text-warning-500" />}
            {isChanged && <Badge variant="warning" size="sm">تغییر کرده</Badge>}
          </div>
          {setting.description && (
            <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
          )}
          <p className="text-[10px] text-gray-400 font-mono mb-2">{setting.key}</p>
          <div className="max-w-xl">
            {renderInput()}
          </div>
        </div>

        <button
          onClick={onToggleLock}
          className={cn(
            'p-2 rounded-lg transition-colors flex-shrink-0',
            setting.is_locked
              ? 'bg-warning-50 text-warning-600 hover:bg-warning-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
          title={setting.is_locked ? 'باز کردن قفل' : 'قفل کردن'}
        >
          {setting.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ==================== History Tab ====================
// ✅ اصلاح: queryClient اضافه شد

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
      toast.success('با موفقیت بازگشت', { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در بازگشت');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={filterGroup}
          onChange={(e) => {
            setFilterGroup(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="">همه گروه‌ها</option>
          {TABS.filter(t => t.id !== 'history').map(tab => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : histories.length === 0 ? (
          <EmptyState
            icon={<History className="w-12 h-12" />}
            title="تاریخچه‌ای وجود ندارد"
            description="هنوز تغییری در تنظیمات ثبت نشده است"
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {histories.map((history) => (
              <div key={history.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="primary" size="sm">
                        {TABS.find(t => t.id === history.group)?.label || history.group}
                      </Badge>
                      <span className="text-sm font-bold text-gray-900">
                        {history.label || history.setting_key}
                      </span>
                      {history.note && (
                        <span className="text-xs text-gray-500">({history.note})</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="bg-error-50 border border-error-100 rounded-lg p-2">
                        <p className="text-[10px] text-error-700 font-bold mb-0.5">قبل:</p>
                        <p className="text-xs text-gray-700 line-clamp-2 font-mono break-all">
                          {history.old_value || '(خالی)'}
                        </p>
                      </div>
                      <div className="bg-success-50 border border-success-100 rounded-lg p-2">
                        <p className="text-[10px] text-success-700 font-bold mb-0.5">بعد:</p>
                        <p className="text-xs text-gray-700 line-clamp-2 font-mono break-all">
                          {history.new_value || '(خالی)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {history.created_at}
                      </span>
                      {history.changed_by && (
                        <span className="flex items-center gap-1">
                          <Settings className="w-3 h-3" />
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
                    className="gap-1 flex-shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    بازگشت
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
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