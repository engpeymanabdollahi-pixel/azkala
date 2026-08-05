import { useState, useMemo, useCallback, memo } from 'react';
import {
  DollarSign, Clock, CheckCircle, XCircle, Calendar,
  AlertCircle, Receipt, PiggyBank, Info,
  Eye, FileDown, Search, X, Wallet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

// ==================== Types ====================
// شکل واقعیِ ردیف‌های seller_transactions — دقیقاً همانی که
// SellerDashboardController::wallet() برمی‌گرداند. نسخه‌ی قبلی این فایل یک
// نوع تخیلی («SellerPayout» با period_start/period_end/reference/paid_at)
// داشت و همیشه از یک stub که [] برمی‌گرداند می‌خواندش — یعنی «تاریخچه
// تسویه» برای هر فروشنده‌ای همیشه خالی بود، با اینکه تراکنش‌های واقعی در
// همان پاسخ /seller/wallet که این صفحه برای موجودی می‌خواند وجود داشتند.
interface SellerTransaction {
  id: number;
  order_id: number | null;
  type: 'commission_deduction' | 'payout' | 'manual_adjustment';
  amount: number;
  description: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

interface WalletResponse {
  data: {
    wallet: { balance: number; last_updated: string | null };
    transactions: SellerTransaction[];
  };
}

const TRANSACTION_TYPE_LABEL: Record<SellerTransaction['type'], string> = {
  payout: 'تسویه‌حساب',
  commission_deduction: 'کسر کمیسیون',
  manual_adjustment: 'اصلاح دستی',
};

const TRANSACTION_STATUS_CONFIG: Record<SellerTransaction['status'], { label: string; variant: 'warning' | 'success' | 'error'; icon: typeof Clock; color: string; description: string }> = {
  pending: { label: 'در انتظار', variant: 'warning', icon: Clock, color: 'from-warning-500 to-warning-600', description: 'در صف پردازش' },
  completed: { label: 'انجام شده', variant: 'success', icon: CheckCircle, color: 'from-success-500 to-success-600', description: 'تکمیل شد' },
  failed: { label: 'ناموفق', variant: 'error', icon: XCircle, color: 'from-error-500 to-error-600', description: 'خطا در تراکنش' },
};

// ==================== Memoized Components ====================
interface StatCardData {
  title: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  subtitle: string;
}

const StatCard = memo(({ stat, index }: { stat: StatCardData; index: number }) => {
  const Icon = stat.icon;
  return (
    <div
      className="group bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          'w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-all',
          stat.gradient
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-[10px] font-medium mb-0.5">{stat.title}</h3>
      <p className="text-sm font-black text-gray-900 dark:text-white truncate">{stat.value}</p>
      <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.subtitle}</p>
    </div>
  );
});
StatCard.displayName = 'StatCard';

// ==================== Main Component ====================
export function SellerPayouts() {
  const [selectedTransaction, setSelectedTransaction] = useState<SellerTransaction | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // موجودی و تاریخچه‌ی واقعی از /seller/wallet — قبلاً apiClient اصلاً در
  // این فایل import نشده بود، پس این درخواست همیشه با
  // «ReferenceError: apiClient is not defined» خطا می‌داد و موجودی همیشه
  // صفر می‌ماند.
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['seller-wallet'],
    queryFn: async (): Promise<WalletResponse> => {
      const response = await apiClient.get('/seller/wallet');
      return response.data;
    },
  });

  const walletBalance = walletData?.data?.wallet?.balance || 0;
  const transactions = useMemo(() => walletData?.data?.transactions || [], [walletData]);

  // این صفحه «تسویه‌حساب» است، پس ردیف‌های نوع payout معیار آمار پرداختی‌اند؛
  // کسر کمیسیون و اصلاح دستی در جدول تراکنش‌ها دیده می‌شوند ولی آمار بالا
  // را تحت تأثیر قرار نمی‌دهند.
  const payoutTransactions = useMemo(() => transactions.filter((t) => t.type === 'payout'), [transactions]);

  const stats = useMemo(() => {
    const completed = payoutTransactions.filter((t) => t.status === 'completed');
    const pending = payoutTransactions.filter((t) => t.status === 'pending');
    const failed = payoutTransactions.filter((t) => t.status === 'failed');
    return {
      totalPaid: completed.reduce((sum, t) => sum + t.amount, 0),
      totalPending: pending.reduce((sum, t) => sum + t.amount, 0),
      totalFailed: failed.reduce((sum, t) => sum + t.amount, 0),
      paidCount: completed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }, [payoutTransactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.description?.toLowerCase().includes(q) || formatPrice(t.amount).includes(searchQuery)
      );
    }
    return filtered;
  }, [transactions, statusFilter, searchQuery]);

  const handleExportAll = useCallback(() => {
    if (filteredTransactions.length === 0) {
      toast.error('تراکنشی برای خروجی گرفتن وجود ندارد');
      return;
    }
    const headers = ['نوع', 'مبلغ', 'وضعیت', 'توضیحات', 'تاریخ'];
    const rows = filteredTransactions.map((t) => [
      TRANSACTION_TYPE_LABEL[t.type],
      t.amount,
      TRANSACTION_STATUS_CONFIG[t.status].label,
      t.description || '-',
      new Date(t.created_at).toLocaleDateString('fa-IR'),
    ]);
    const csvContent = '﻿' + [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('فایل CSV با موفقیت دانلود شد');
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-56 mt-1 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">تسویه‌حساب</h1>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">مدیریت درآمد و پرداخت‌ها</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleExportAll}>
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-xs">خروجی</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {([
            { title: 'موجودی قابل برداشت', value: formatPrice(walletBalance), icon: PiggyBank, gradient: 'from-success-500 to-success-600', subtitle: 'موجودی فعلی کیف پول' },
            { title: 'تسویه‌شده', value: formatPrice(stats.totalPaid), icon: CheckCircle, gradient: 'from-primary-500 to-primary-600', subtitle: `${stats.paidCount} تراکنش` },
            { title: 'در انتظار', value: formatPrice(stats.totalPending), icon: Clock, gradient: 'from-warning-500 to-warning-600', subtitle: `${stats.pendingCount} تراکنش` },
            { title: 'ناموفق', value: formatPrice(stats.totalFailed), icon: XCircle, gradient: 'from-error-500 to-error-600', subtitle: `${stats.failedCount} تراکنش` },
          ] satisfies StatCardData[]).map((stat, idx) => (
            <StatCard key={idx} stat={stat} index={idx} />
          ))}
        </div>

        {/* Transactions History */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-gray-50/50 to-white dark:from-slate-900/50 dark:to-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Receipt className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">تراکنش‌های مالی</h2>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{filteredTransactions.length} تراکنش</p>
                </div>
              </div>

              <div className="flex gap-1.5">
                <div className="relative">
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 pr-7 pl-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-[10px]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-[10px]"
                >
                  <option value="all">همه</option>
                  <option value="pending">در انتظار</option>
                  <option value="completed">انجام شده</option>
                  <option value="failed">ناموفق</option>
                </select>
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-10 h-10" />}
              title={searchQuery || statusFilter !== 'all' ? 'تراکنشی یافت نشد' : 'هنوز تراکنشی ثبت نشده'}
              description={searchQuery || statusFilter !== 'all' ? 'فیلترها را تغییر دهید' : 'به محض ثبت اولین تراکنش نمایش داده می‌شود'}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-l from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">نوع</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">مبلغ</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">وضعیت</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">تاریخ</th>
                      <th className="text-center px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {filteredTransactions.map((t) => {
                      const statusConfig = TRANSACTION_STATUS_CONFIG[t.status];
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={t.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform', statusConfig.color)}>
                                <StatusIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-[11px]">{TRANSACTION_TYPE_LABEL[t.type]}</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">{statusConfig.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className={cn('font-black text-sm', t.type === 'commission_deduction' ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white')}>
                              {t.type === 'commission_deduction' ? '−' : ''}{formatPrice(t.amount)}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={statusConfig.variant} size="sm" className="gap-1 text-[10px]">
                              <StatusIcon className="w-2.5 h-2.5" />{statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1 text-[10px] text-gray-700 dark:text-gray-300">
                              <Calendar className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500" />
                              <span>{new Date(t.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="xs" onClick={() => setSelectedTransaction(t)} className="gap-0.5 text-[10px]">
                                <Eye className="w-2.5 h-2.5" />
                                <span className="hidden lg:inline">جزئیات</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
                {filteredTransactions.map((t) => {
                  const statusConfig = TRANSACTION_STATUS_CONFIG[t.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={t.id} className="p-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', statusConfig.color)}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-[11px]">{TRANSACTION_TYPE_LABEL[t.type]}</p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(t.created_at).toLocaleDateString('fa-IR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={statusConfig.variant} size="sm" className="gap-0.5 text-[9px]">
                          <StatusIcon className="w-2.5 h-2.5" />{statusConfig.label}
                        </Badge>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-2 mb-2">
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">مبلغ</p>
                        <p className={cn('font-black text-[11px]', t.type === 'commission_deduction' ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white')}>
                          {t.type === 'commission_deduction' ? '−' : ''}{formatPrice(t.amount)}
                        </p>
                      </div>
                      <Button variant="outline" size="xs" className="w-full gap-0.5 text-[10px]" onClick={() => setSelectedTransaction(t)}>
                        <Eye className="w-3 h-3" />جزئیات
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-3 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/10 dark:via-slate-800 dark:to-accent-900/10 border border-primary-100 dark:border-primary-800/40 rounded-xl p-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-900 dark:text-white mb-1 text-xs">قوانین تسویه‌حساب</h3>
              <ul className="space-y-1 text-[10px] text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>کمیسیون پیش‌فرض ازکالا ۵٪ است (ممکن است برای برخی فروشندگان نرخ متفاوتی تعیین شده باشد)</span>
                </li>
                <li className="flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 text-warning-500 flex-shrink-0 mt-0.5" />
                  <span>برای درخواست تسویه یا ثبت/ویرایش اطلاعات بانکی با پشتیبانی تماس بگیرید</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Transaction Detail Modal ============ */}
      <Modal
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        size="sm"
        title="جزئیات تراکنش"
      >
        {selectedTransaction && (() => {
          const statusConfig = TRANSACTION_STATUS_CONFIG[selectedTransaction.status];
          const StatusIcon = statusConfig.icon;
          return (
            <div className="space-y-3">
              <div className={cn('bg-gradient-to-l rounded-xl p-3 text-white relative overflow-hidden', statusConfig.color)}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white/80 text-[10px]">وضعیت</p>
                      <p className="font-black text-sm">{statusConfig.label}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-white/80 text-[10px]">مبلغ</p>
                    <p className="font-black text-base">{formatPrice(selectedTransaction.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-gray-400 dark:text-gray-500" />نوع
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">{TRANSACTION_TYPE_LABEL[selectedTransaction.type]}</span>
                </div>
                {selectedTransaction.description && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">توضیحات</span>
                    <span className="font-bold text-gray-900 dark:text-white text-xs">{selectedTransaction.description}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />تاریخ ثبت
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">
                    {new Date(selectedTransaction.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
export default SellerPayouts;
