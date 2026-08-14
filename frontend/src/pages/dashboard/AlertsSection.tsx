import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellRing, BellOff, Package, TrendingDown, Target,
  Trash2, ToggleLeft, ToggleRight, Eye, ExternalLink,
  AlertCircle, CheckCircle2, Calendar, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { useAlertApi } from '@/hooks/api/useAlertApi';
import type { ProductAlert, AlertType } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type FilterType = 'all' | AlertType;
type StatusFilter = 'all' | 'active' | 'triggered' | 'inactive';

export function AlertsSection() {
  const navigate = useNavigate();
  const { alerts, totalAlerts, isAlertsLoading, deleteAlert, toggleAlert } = useAlertApi();
  
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // فیلتر هشدارها
  const filteredAlerts = alerts.filter(alert => {
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    if (statusFilter === 'active' && (!alert.is_active || alert.is_triggered)) return false;
    if (statusFilter === 'triggered' && !alert.is_triggered) return false;
    if (statusFilter === 'inactive' && alert.is_active) return false;
    return true;
  });

  // آمار تفکیکی
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.is_active && !a.is_triggered).length,
    triggered: alerts.filter(a => a.is_triggered).length,
    restock: alerts.filter(a => a.type === 'restock').length,
    price_drop: alerts.filter(a => a.type === 'price_drop').length,
    target_price: alerts.filter(a => a.type === 'target_price').length,
  };

  // Handle toggle
  const handleToggle = (alert: ProductAlert) => {
    toggleAlert(alert.id);
  };

  // Handle delete
  const handleDelete = (alertId: number) => {
    if (confirmDeleteId === alertId) {
      deleteAlert(alertId);
      setConfirmDeleteId(null);
      toast.success('هشدار حذف شد', { icon: '🗑️' });
    } else {
      setConfirmDeleteId(alertId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  // Config بر اساس نوع
  const getTypeConfig = (type: AlertType) => {
    return {
      restock: {
        label: 'موجودی',
        icon: Package,
        color: 'from-success-500 to-success-600',
        bgColor: 'bg-success-50 dark:bg-success-900/20',
        borderColor: 'border-success-200 dark:border-success-800',
        textColor: 'text-success-700 dark:text-success-400',
      },
      price_drop: {
        label: 'کاهش قیمت',
        icon: TrendingDown,
        color: 'from-primary-500 to-primary-600',
        bgColor: 'bg-primary-50 dark:bg-primary-900/20',
        borderColor: 'border-primary-200 dark:border-primary-800',
        textColor: 'text-primary-700 dark:text-primary-400',
      },
      target_price: {
        label: 'قیمت هدف',
        icon: Target,
        color: 'from-accent-500 to-accent-600',
        bgColor: 'bg-accent-50 dark:bg-accent-900/20',
        borderColor: 'border-accent-200 dark:border-accent-800',
        textColor: 'text-accent-700 dark:text-accent-400',
      },
    }[type];
  };

  // نمایش شرایط هشدار
  const getConditionText = (alert: ProductAlert) => {
    if (alert.type === 'restock') return 'به محض شارژ مجدد';
    if (alert.type === 'price_drop') {
      return alert.discount_percentage 
        ? `با ${alert.discount_percentage}٪ تخفیف`
        : 'با هر کاهش قیمت';
    }
    if (alert.type === 'target_price') {
      return `وقتی قیمت به ${formatPrice(alert.target_price || 0)} تومان برسد`;
    }
    return '';
  };

  // Loading state
  if (isAlertsLoading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header با آمار */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              هشدارهای من
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.total > 0 ? `${stats.total} هشدار ثبت شده` : 'هنوز هشداری ثبت نکرده‌اید'}
            </p>
          </div>
          {stats.active > 0 && (
            <Badge variant="primary" className="gap-1">
              <BellRing className="w-3 h-3" />
              {stats.active} فعال
            </Badge>
          )}
        </div>

        {/* آمار تفکیکی */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'کل', value: stats.total, color: 'from-gray-500 to-gray-600', icon: Bell },
            { label: 'فعال', value: stats.active, color: 'from-success-500 to-success-600', icon: BellRing },
            { label: 'اعمال شده', value: stats.triggered, color: 'from-primary-500 to-primary-600', icon: CheckCircle2 },
            { label: 'غیرفعال', value: stats.total - stats.active - stats.triggered, color: 'from-gray-400 to-gray-500', icon: BellOff },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-2.5 text-center">
                <div className={cn(
                  'w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center mx-auto mb-1.5',
                  stat.color
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* فیلترها */}
      {stats.total > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">فیلتر:</span>
          </div>
          
          {/* فیلتر نوع */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              { value: 'all', label: 'همه', count: stats.total },
              { value: 'restock', label: 'موجودی', count: stats.restock },
              { value: 'price_drop', label: 'کاهش قیمت', count: stats.price_drop },
              { value: 'target_price', label: 'قیمت هدف', count: stats.target_price },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setTypeFilter(item.value as FilterType)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1',
                  typeFilter === item.value
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
              >
                {item.label}
                <span className={cn(
                  'px-1 rounded text-[9px]',
                  typeFilter === item.value ? 'bg-white/20' : 'bg-white dark:bg-slate-800'
                )}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* فیلتر وضعیت */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'active', label: 'فعال' },
              { value: 'triggered', label: 'اعمال شده' },
              { value: 'inactive', label: 'غیرفعال' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value as StatusFilter)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  statusFilter === item.value
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* لیست هشدارها */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <BellOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm mb-1">
              {stats.total === 0 ? 'هنوز هشداری ثبت نکرده‌اید' : 'هیچ هشداری با این فیلتر یافت نشد'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
              {stats.total === 0 
                ? 'با ثبت هشدار برای محصولات مورد علاقه‌تان، از تغییرات قیمت و موجودی مطلع شوید'
                : 'فیلترهای خود را تغییر دهید'}
            </p>
            {stats.total === 0 && (
              <Button
                onClick={() => navigate('/products')}
                size="sm"
                className="gap-1.5"
              >
                <Eye className="w-4 h-4" />
                مشاهده محصولات
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {filteredAlerts.map(alert => {
              const typeConfig = getTypeConfig(alert.type);
              const Icon = typeConfig.icon;
              const isTriggered = alert.is_triggered;
              const isConfirmDelete = confirmDeleteId === alert.id;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50',
                    isTriggered && 'bg-success-50/30 dark:bg-success-900/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* آیکون نوع */}
                    <div className={cn(
                      'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm',
                      typeConfig.color
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* اطلاعات */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <Badge
                              variant="gray"
                              size="sm"
                              className={cn('text-[10px]', typeConfig.textColor, typeConfig.borderColor)}
                            >
                              {typeConfig.label}
                            </Badge>
                            {isTriggered ? (
                              <Badge variant="success" size="sm" className="text-[10px] gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                اعمال شده
                              </Badge>
                            ) : alert.is_active ? (
                              <Badge variant="primary" size="sm" className="text-[10px] gap-1">
                                <BellRing className="w-2.5 h-2.5" />
                                فعال
                              </Badge>
                            ) : (
                              <Badge variant="gray" size="sm" className="text-[10px]">
                                غیرفعال
                              </Badge>
                            )}
                          </div>
                          
                          {/* نام محصول */}
                          <button
                            onClick={() => alert.product && navigate(`/products/${alert.product.slug}`)}
                            className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-right line-clamp-1 flex items-center gap-1 group"
                          >
                            <span className="truncate">{alert.product?.name || 'محصول حذف شده'}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>

                          {/* شرایط */}
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {getConditionText(alert)}
                          </p>

                          {/* قیمت اصلی و تاریخ */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              قیمت هنگام ثبت: <span className="font-bold">{formatPrice(alert.original_price)} تومان</span>
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(alert.created_at).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                        </div>

                        {/* تصویر محصول */}
                        {alert.product?.main_image && (
                          <button
                            onClick={() => alert.product && navigate(`/products/${alert.product.slug}`)}
                            className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                          >
                            <SafeImage
                              src={alert.product.main_image}
                              alt={alert.product.name}
                              className="w-full h-full object-cover"
                              fallbackEmoji="📦"
                              showEmojiOnError
                              aspectRatio="square"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isTriggered && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleToggle(alert)}
                        className={cn(
                          'gap-1 flex-1',
                          alert.is_active
                            ? 'text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                            : 'text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20'
                        )}
                      >
                        {alert.is_active ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />
                            <span className="text-[11px]">غیرفعال کردن</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" />
                            <span className="text-[11px]">فعال کردن</span>
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant={isConfirmDelete ? 'destructive' : 'ghost'}
                        size="xs"
                        onClick={() => handleDelete(alert.id)}
                        className={cn(
                          'gap-1 flex-1',
                          !isConfirmDelete && 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20'
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                          {isConfirmDelete ? 'تأیید حذف؟' : 'حذف'}
                        </span>
                      </Button>

                      {alert.product && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate(`/products/${alert.product!.slug}`)}
                          className="gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">مشاهده</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Triggered message */}
                  {isTriggered && alert.triggered_at && (
                    <div className="mt-2 pt-2 border-t border-success-200 dark:border-success-800 flex items-center gap-1.5 text-[10px] text-success-700 dark:text-success-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        این هشدار در تاریخ {new Date(alert.triggered_at).toLocaleDateString('fa-IR')} اعمال شد
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-l from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">
              چگونه کار می‌کند؟
            </p>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              وقتی قیمت محصولی که برای آن هشدار ثبت کرده‌اید کاهش یابد یا موجود شود، از طریق نوتیفیکیشن سایت و ایمیل به شما اطلاع داده می‌شود.
              هشدارهای اعمال‌شده به طور خودکار غیرفعال می‌شوند.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertsSection;