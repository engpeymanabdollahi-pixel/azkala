import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  DollarSign, Clock, CheckCircle, XCircle, Download, Calendar,
  TrendingUp, AlertCircle, Building2, FileText, Copy, ArrowUpRight,
  ArrowDownRight, Banknote, Receipt, PiggyBank, Info, Shield,
  Plus, Eye, FileDown, Search, X, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

// ==================== Types ====================
interface SellerPayout {
  id: number;
  seller_id: number;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  period_start: string;
  period_end: string;
  reference?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ==================== Memoized Components ====================
const StatCard = memo(({ stat, index }: { stat: any; index: number }) => {
  const Icon = stat.icon;
  return (
    <div
      className="group bg-white rounded-xl p-3 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          'w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-all',
          stat.gradient
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className={cn(
          'flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded',
          stat.changeType === 'up' ? 'bg-success-50 text-success-600' :
          stat.changeType === 'down' ? 'bg-error-50 text-error-600' :
          'bg-gray-100 text-gray-600'
        )}>
          {stat.changeType === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> :
           stat.changeType === 'down' ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
          {stat.change}
        </div>
      </div>
      <h3 className="text-gray-600 text-[10px] font-medium mb-0.5">{stat.title}</h3>
      <p className="text-sm font-black text-gray-900 truncate">{stat.value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{stat.subtitle}</p>
    </div>
  );
});

const ChartBar = memo(({ data, maxAmount }: { data: any; maxAmount: number }) => {
  const safeMaxAmount = maxAmount > 0 ? maxAmount : 1;
  const height = Math.max((data.amount / safeMaxAmount) * 100, 0);
  
  return (
    <div className="flex-1 flex flex-col items-center gap-1 group">
      <div className="relative w-full flex-1 flex items-end">
        <div 
          className={cn(
            'w-full bg-gradient-to-t rounded-t-lg transition-all duration-500 hover:opacity-80 relative cursor-pointer',
            data.color
          )}
          style={{ height: `${height}%` }}
          role="img"
          aria-label={`${data.month}: ${formatPrice(data.amount)}`}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">
            <div className="font-black">{(data.amount / 1000000).toFixed(1)}M</div>
            <div className="text-[8px] text-gray-300">{data.month}</div>
          </div>
        </div>
      </div>
      <span className="text-[10px] text-gray-600 font-medium">{data.month}</span>
    </div>
  );
});

// ==================== Main Component ====================
export function SellerPayouts() {
  const { seller } = useAuthStore();
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showBankInfoModal, setShowBankInfoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<SellerPayout | null>(null);
  const [requestAmount, setRequestAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockPayouts: SellerPayout[] = [
        {
          id: 1, seller_id: 1, amount: 12500000, status: 'paid',
          period_start: '2024-01-01T00:00:00Z', period_end: '2024-01-15T23:59:59Z',
          reference: 'PAY-20240116-001', paid_at: '2024-01-16T10:00:00Z',
          created_at: '2024-01-16T09:00:00Z', updated_at: '2024-01-16T10:00:00Z',
        },
        {
          id: 2, seller_id: 1, amount: 8750000, status: 'processing',
          period_start: '2024-01-16T00:00:00Z', period_end: '2024-01-31T23:59:59Z',
          created_at: '2024-02-01T09:00:00Z', updated_at: '2024-02-01T09:00:00Z',
        },
        {
          id: 3, seller_id: 1, amount: 15200000, status: 'pending',
          period_start: '2024-02-01T00:00:00Z', period_end: '2024-02-15T23:59:59Z',
          created_at: '2024-02-15T09:00:00Z', updated_at: '2024-02-15T09:00:00Z',
        },
        {
          id: 4, seller_id: 1, amount: 9800000, status: 'paid',
          period_start: '2023-12-16T00:00:00Z', period_end: '2023-12-31T23:59:59Z',
          reference: 'PAY-20240102-002', paid_at: '2024-01-02T14:30:00Z',
          created_at: '2024-01-01T09:00:00Z', updated_at: '2024-01-02T14:30:00Z',
        },
        {
          id: 5, seller_id: 1, amount: 6500000, status: 'failed',
          period_start: '2023-12-01T00:00:00Z', period_end: '2023-12-15T23:59:59Z',
          reference: 'PAY-20231216-003',
          created_at: '2023-12-16T09:00:00Z', updated_at: '2023-12-17T10:00:00Z',
        },
      ];
      setPayouts(mockPayouts);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    const config = {
      pending: { label: 'در انتظار', variant: 'warning' as const, icon: Clock, color: 'from-warning-500 to-warning-600', description: 'در صف پردازش' },
      processing: { label: 'در حال پردازش', variant: 'primary' as const, icon: TrendingUp, color: 'from-primary-500 to-primary-600', description: 'در حال انتقال' },
      paid: { label: 'پرداخت شده', variant: 'success' as const, icon: CheckCircle, color: 'from-success-500 to-success-600', description: 'واریز شد' },
      failed: { label: 'ناموفق', variant: 'error' as const, icon: XCircle, color: 'from-error-500 to-error-600', description: 'خطا در انتقال' },
    };
    return config[status as keyof typeof config] || config.pending;
  }, []);

  const stats = useMemo(() => {
    const paid = payouts.filter((p) => p.status === 'paid');
    const processing = payouts.filter((p) => p.status === 'processing');
    const pending = payouts.filter((p) => p.status === 'pending');
    const failed = payouts.filter((p) => p.status === 'failed');

    return {
      totalPaid: paid.reduce((sum, p) => sum + p.amount, 0),
      totalProcessing: processing.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
      totalFailed: failed.reduce((sum, p) => sum + p.amount, 0),
      paidCount: paid.length,
      processingCount: processing.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      availableBalance: pending.reduce((sum, p) => sum + p.amount, 0) + 5200000,
      totalRevenue: payouts.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    let filtered = payouts;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatPrice(p.amount).includes(searchQuery)
      );
    }
    return filtered;
  }, [payouts, statusFilter, searchQuery]);

  const monthlyData = useMemo(() => [
    { month: 'فروردین', amount: 8500000, color: 'from-primary-400 to-primary-500' },
    { month: 'اردیبهشت', amount: 12000000, color: 'from-primary-500 to-primary-600' },
    { month: 'خرداد', amount: 9800000, color: 'from-primary-500 to-primary-600' },
    { month: 'تیر', amount: 15500000, color: 'from-accent-500 to-accent-600' },
    { month: 'مرداد', amount: 18200000, color: 'from-accent-500 to-accent-600' },
    { month: 'شهریور', amount: 14300000, color: 'from-primary-500 to-primary-600' },
  ], []);

  const maxMonthlyAmount = useMemo(() => 
    Math.max(...monthlyData.map(d => d.amount), 1),
    [monthlyData]
  );

  const handleCopyReference = useCallback((reference: string) => {
    navigator.clipboard.writeText(reference);
    toast.success('کد پیگیری کپی شد', { icon: '📋' });
  }, []);

  const handleDownloadReceipt = useCallback((payout: SellerPayout) => {
    toast.success('رسید در حال دانلود...', { icon: '📥' });
    setTimeout(() => {
      toast.success('رسید دانلود شد', { icon: '✅' });
    }, 1500);
  }, []);

  const handleExportAll = useCallback(() => {
    toast.success('در حال آماده‌سازی فایل...', { icon: '📊' });
    setTimeout(() => {
      toast.success('فایل دانلود شد', { icon: '✅' });
    }, 2000);
  }, []);

  const handleRequestPayout = useCallback(() => {
    const amount = Number(requestAmount.replace(/,/g, ''));
    if (!amount || amount < 1000000) {
      toast.error('حداقل مبلغ ۱,۰۰۰,۰۰۰ تومان است');
      return;
    }
    if (amount > stats.availableBalance) {
      toast.error('مبلغ بیشتر از موجودی است');
      return;
    }
    setShowConfirmModal(true);
  }, [requestAmount, stats.availableBalance]);

  const confirmRequestPayout = useCallback(() => {
    toast.success('درخواست ثبت شد', { icon: '✅' });
    setShowConfirmModal(false);
    setShowRequestModal(false);
    setRequestAmount('');
  }, []);

  if (isLoading) {
    return (
      <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-56 mt-1 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900">تسویه‌حساب</h1>
              <p className="text-[11px] text-gray-600">مدیریت درآمد و پرداخت‌ها</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleExportAll}>
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-xs">خروجی</span>
            </Button>
            <Button 
              size="sm" 
              className="gap-1"
              onClick={() => setShowRequestModal(true)}
              disabled={stats.availableBalance < 1000000}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-xs">درخواست تسویه</span>
              <span className="md:hidden text-xs">تسویه</span>
            </Button>
          </div>
        </div>

        {/* Bank Info Alert */}
        {!seller?.bank_info?.iban && (
          <div className="bg-gradient-to-l from-warning-50 to-accent-50 border-2 border-warning-200 rounded-xl p-3 mb-4 animate-fade-in">
            <div className="flex items-start gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-warning-900 mb-1 text-sm">اطلاعات بانکی تکمیل نشده</h3>
                <p className="text-warning-800 mb-2 text-xs leading-relaxed">
                  برای دریافت پرداخت‌ها، اطلاعات بانکی خود را تکمیل کنید.
                </p>
                <Button 
                  variant="warning" 
                  size="sm"
                  onClick={() => setShowBankInfoModal(true)}
                  className="text-xs"
                >
                  <Building2 className="w-3 h-3 ml-1" />
                  تکمیل اطلاعات
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {[
            { title: 'موجودی قابل برداشت', value: formatPrice(stats.availableBalance), icon: PiggyBank, gradient: 'from-success-500 to-success-600', change: '+15%', changeType: 'up' as const, subtitle: 'آماده تسویه' },
            { title: 'پرداخت شده', value: formatPrice(stats.totalPaid), icon: CheckCircle, gradient: 'from-primary-500 to-primary-600', change: `${stats.paidCount} تراکنش`, changeType: 'neutral' as const, subtitle: 'مجموع کل' },
            { title: 'در حال پردازش', value: formatPrice(stats.totalProcessing), icon: TrendingUp, gradient: 'from-accent-500 to-accent-600', change: `${stats.processingCount} تراکنش`, changeType: 'neutral' as const, subtitle: 'در صف انتقال' },
            { title: 'در انتظار', value: formatPrice(stats.totalPending), icon: Clock, gradient: 'from-warning-500 to-warning-600', change: `${stats.pendingCount} تراکنش`, changeType: 'neutral' as const, subtitle: 'در صف پردازش' },
          ].map((stat, idx) => (
            <StatCard key={idx} stat={stat} index={idx} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-3 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">درآمد ۶ ماه اخیر</h2>
                  <p className="text-[10px] text-gray-500">نمودار درآمد ماهانه</p>
                </div>
              </div>
              <Badge variant="success" size="sm" className="gap-0.5 text-[10px]">
                <ArrowUpRight className="w-2.5 h-2.5" />
                +23%
              </Badge>
            </div>

            <div className="h-40 flex items-end justify-between gap-1 mb-3" role="img" aria-label="نمودار درآمد">
              {monthlyData.map((data, idx) => (
                <ChartBar key={idx} data={data} maxAmount={maxMonthlyAmount} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">میانگین ماهانه</p>
                <p className="font-black text-gray-900 text-xs">{(stats.totalRevenue / 6 / 1000000).toFixed(1)}M</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">بیشترین ماه</p>
                <p className="font-black text-success-600 text-xs">{(maxMonthlyAmount / 1000000).toFixed(1)}M</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">رشد سالانه</p>
                <p className="font-black text-primary-600 text-xs flex items-center justify-center gap-0.5">
                  <ArrowUpRight className="w-2.5 h-2.5" />23%
                </p>
              </div>
            </div>
          </div>

          {/* Bank Info Card */}
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-xl p-3 text-white relative overflow-hidden shadow-lg animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-black text-sm">اطلاعات بانکی</h3>
                </div>
                <button 
                  onClick={() => setShowBankInfoModal(true)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <FileText className="w-3 h-3" />
                </button>
              </div>

              {seller?.bank_info?.iban ? (
                <div className="space-y-1.5">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                    <p className="text-white/80 text-[10px] mb-0.5">نام صاحب حساب</p>
                    <p className="font-black text-xs">{seller.bank_info.account_holder || '---'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                    <p className="text-white/80 text-[10px] mb-0.5">شماره شبا</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-mono font-black text-[11px]" dir="ltr">IR{seller.bank_info.iban || '---'}</p>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(seller.bank_info.iban || ''); toast.success('شماره شبا کپی شد'); }}
                        className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                    <p className="text-white/80 text-[10px] mb-0.5">بانک</p>
                    <p className="font-black text-xs">{seller.bank_info.bank_name || '---'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-white/90 text-[11px] mb-2">اطلاعات بانکی تکمیل نشده</p>
                  <Button variant="secondary" size="sm" onClick={() => setShowBankInfoModal(true)} className="w-full text-xs">
                    تکمیل اطلاعات
                  </Button>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="flex items-center gap-1 text-[10px] text-white/80">
                  <Shield className="w-3 h-3" />
                  <span>اطلاعات شما امن است</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payouts History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-gray-100 bg-gradient-to-l from-gray-50/50 to-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Receipt className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">تاریخچه تسویه</h2>
                  <p className="text-[10px] text-gray-500">{filteredPayouts.length} تراکنش</p>
                </div>
              </div>
              
              <div className="flex gap-1.5">
                <div className="relative">
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 pr-7 pl-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-[10px]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-[10px]"
                >
                  <option value="all">همه</option>
                  <option value="pending">در انتظار</option>
                  <option value="processing">در حال پردازش</option>
                  <option value="paid">پرداخت شده</option>
                  <option value="failed">ناموفق</option>
                </select>
              </div>
            </div>
          </div>

          {filteredPayouts.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-10 h-10" />}
              title={searchQuery || statusFilter !== 'all' ? 'تراکنشی یافت نشد' : 'هنوز تسویه‌ای انجام نشده'}
              description={searchQuery || statusFilter !== 'all' ? 'فیلترها را تغییر دهید' : 'به محض اولین تسویه نمایش داده می‌شود'}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-l from-gray-50 to-white border-b border-gray-100">
                    <tr>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700">دوره</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700">مبلغ</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700">وضعیت</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700">کد پیگیری</th>
                      <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700">تاریخ پرداخت</th>
                      <th className="text-center px-3 py-2.5 text-[11px] font-black text-gray-700">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayouts.map((payout) => {
                      const statusConfig = getStatusConfig(payout.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={payout.id} className="hover:bg-primary-50/30 transition-colors group">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform', statusConfig.color)}>
                                <StatusIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-[11px]">
                                  {new Date(payout.period_start).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}{' '}
                                  تا{' '}
                                  {new Date(payout.period_end).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-[9px] text-gray-500 mt-0.5">{statusConfig.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-black text-gray-900 text-sm">{formatPrice(payout.amount)}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={statusConfig.variant} size="sm" className="gap-1 text-[10px]">
                              <StatusIcon className="w-2.5 h-2.5" />{statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            {payout.reference ? (
                              <div className="flex items-center gap-1.5">
                                <p className="font-mono text-[10px] font-bold text-gray-900" dir="ltr">{payout.reference}</p>
                                <button onClick={() => handleCopyReference(payout.reference!)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {payout.paid_at ? (
                              <div className="flex items-center gap-1 text-[10px] text-gray-700">
                                <Calendar className="w-2.5 h-2.5 text-gray-400" />
                                <span>{new Date(payout.paid_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="xs" onClick={() => setSelectedPayout(payout)} className="gap-0.5 text-[10px]">
                                <Eye className="w-2.5 h-2.5" />
                                <span className="hidden lg:inline">جزئیات</span>
                              </Button>
                              {payout.status === 'paid' && (
                                <Button variant="ghost" size="xs" onClick={() => handleDownloadReceipt(payout)}>
                                  <Download className="w-2.5 h-2.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredPayouts.map((payout) => {
                  const statusConfig = getStatusConfig(payout.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={payout.id} className="p-2.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', statusConfig.color)}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-[11px]">
                              {new Date(payout.period_start).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}{' '}
                              تا{' '}
                              {new Date(payout.period_end).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{statusConfig.description}</p>
                          </div>
                        </div>
                        <Badge variant={statusConfig.variant} size="sm" className="gap-0.5 text-[9px]">
                          <StatusIcon className="w-2.5 h-2.5" />{statusConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[9px] text-gray-500 mb-0.5">مبلغ</p>
                          <p className="font-black text-gray-900 text-[11px]">{formatPrice(payout.amount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[9px] text-gray-500 mb-0.5">کد پیگیری</p>
                          {payout.reference ? (
                            <p className="font-mono text-[10px] font-bold text-gray-900" dir="ltr">{payout.reference}</p>
                          ) : (
                            <span className="text-gray-400 text-[10px]">-</span>
                          )}
                        </div>
                      </div>

                      {payout.paid_at && (
                        <p className="text-[9px] text-gray-600 flex items-center gap-0.5 mb-2">
                          <Calendar className="w-2.5 h-2.5" />
                          پرداخت: {new Date(payout.paid_at).toLocaleDateString('fa-IR')}
                        </p>
                      )}

                      <div className="flex gap-1.5">
                        <Button variant="outline" size="xs" className="flex-1 gap-0.5 text-[10px]" onClick={() => setSelectedPayout(payout)}>
                          <Eye className="w-2.5 h-2.5" />جزئیات
                        </Button>
                        {payout.status === 'paid' && (
                          <Button variant="outline" size="xs" className="gap-0.5 text-[10px]" onClick={() => handleDownloadReceipt(payout)}>
                            <Download className="w-2.5 h-2.5" />رسید
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-3 bg-gradient-to-br from-primary-50 via-white to-accent-50 border border-primary-100 rounded-xl p-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-900 mb-1 text-xs">قوانین تسویه‌حساب</h3>
              <ul className="space-y-1 text-[10px] text-gray-700">
                <li className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>تسویه هر ۱۵ روز یکبار</span>
                </li>
                <li className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>حداقل مبلغ ۱,۰۰۰,۰۰۰ تومان</span>
                </li>
                <li className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>واریز حداکثر ۷۲ ساعت کاری</span>
                </li>
                <li className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>کمیسیون ازکالا ۵٪</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Request Payout Modal ============ */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => { setShowRequestModal(false); setRequestAmount(''); }}
        size="md"
        title="درخواست تسویه‌حساب"
      >
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-success-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Banknote className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-600 mt-3 text-sm">مبلغ مورد نظر برای تسویه را وارد کنید</p>
        </div>

        <div className="bg-gradient-to-l from-success-50 to-primary-50 border-2 border-success-200 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-success-600" />
              موجودی قابل برداشت:
            </span>
            <span className="font-black text-success-700 text-sm">{formatPrice(stats.availableBalance)}</span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              مبلغ درخواست (تومان) <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value.replace(/[^\d,]/g, ''))}
              placeholder="۱,۰۰۰,۰۰۰"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-success-500 font-mono text-left text-sm"
              dir="ltr"
            />
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              حداقل مبلغ: ۱,۰۰۰,۰۰۰ تومان
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-600 mb-1.5">مبالغ پیشنهادی:</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[1000000, 5000000, stats.availableBalance].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setRequestAmount(amount.toString())}
                  className="px-2 py-1.5 bg-gray-100 hover:bg-success-50 hover:text-success-700 rounded-lg text-[10px] font-bold transition-colors"
                >
                  {amount === stats.availableBalance ? 'کل موجودی' : formatPrice(amount)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={() => { setShowRequestModal(false); setRequestAmount(''); }}>
            انصراف
          </Button>
          <Button className="flex-1" size="md" onClick={handleRequestPayout} disabled={!requestAmount}>
            <Banknote className="w-4 h-4 ml-1.5" />
            ثبت درخواست
          </Button>
        </div>
      </Modal>

      {/* ============ Confirmation Modal ============ */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        size="sm"
        title="تأیید درخواست تسویه"
      >
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-warning-600" />
          </div>
          <h3 className="text-base font-black text-gray-900 mb-1.5">آیا مطمئن هستید؟</h3>
          <p className="text-gray-600 text-xs">
            شما در حال درخواست تسویه به مبلغ <strong className="text-primary-600">{formatPrice(Number(requestAmount.replace(/,/g, '')))}</strong> هستید.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={() => setShowConfirmModal(false)}>
            انصراف
          </Button>
          <Button className="flex-1" size="md" onClick={confirmRequestPayout}>
            <CheckCircle className="w-4 h-4 ml-1.5" />
            تأیید و ارسال
          </Button>
        </div>
      </Modal>

      {/* ============ Bank Info Modal ============ */}
      <Modal
        isOpen={showBankInfoModal}
        onClose={() => setShowBankInfoModal(false)}
        size="md"
        title="اطلاعات بانکی"
      >
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-600 mt-3 text-sm">اطلاعات حساب بانکی خود را وارد کنید</p>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              نام صاحب حساب <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              placeholder="علی رضایی"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              شماره شبا <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              placeholder="IR012345678901234567890123"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono text-sm"
              dir="ltr"
            />
            <p className="text-[10px] text-gray-500 mt-1">۲۴ رقم بعد از IR</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              نام بانک <span className="text-error-500">*</span>
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm">
              <option value="">انتخاب کنید</option>
              <option value="meli">بانک ملی</option>
              <option value="saderat">بانک صادرات</option>
              <option value="tejarat">بانک تجارت</option>
              <option value="mellat">بانک ملت</option>
              <option value="pasargad">بانک پاسارگاد</option>
              <option value="saman">بانک سامان</option>
              <option value="parsian">بانک پارسیان</option>
            </select>
          </div>
        </div>

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-2 mb-3 flex items-start gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-primary-800 leading-relaxed">
            اطلاعات بانکی شما به صورت رمزنگاری شده ذخیره می‌شود.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={() => setShowBankInfoModal(false)}>
            انصراف
          </Button>
          <Button className="flex-1" size="md" onClick={() => { setShowBankInfoModal(false); toast.success('اطلاعات بانکی ذخیره شد', { icon: '✅' }); }}>
            <CheckCircle className="w-4 h-4 ml-1.5" />
            ذخیره اطلاعات
          </Button>
        </div>
      </Modal>

      {/* ============ Payout Detail Modal ============ */}
      <Modal
        isOpen={selectedPayout !== null}
        onClose={() => setSelectedPayout(null)}
        size="md"
        title="جزئیات تسویه‌حساب"
      >
        {selectedPayout && (() => {
          const statusConfig = getStatusConfig(selectedPayout.status);
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
                    <p className="font-black text-base">{formatPrice(selectedPayout.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-400" />دوره تسویه
                  </span>
                  <span className="font-bold text-gray-900 text-xs">
                    {new Date(selectedPayout.period_start).toLocaleDateString('fa-IR')} تا{' '}
                    {new Date(selectedPayout.period_end).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                {selectedPayout.reference && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-gray-400" />کد پیگیری
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-900 text-xs" dir="ltr">{selectedPayout.reference}</span>
                      <button
                        onClick={() => handleCopyReference(selectedPayout.reference!)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
                {selectedPayout.paid_at && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-success-500" />تاریخ پرداخت
                    </span>
                    <span className="font-bold text-gray-900 text-xs">
                      {new Date(selectedPayout.paid_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gray-400" />تاریخ ثبت
                  </span>
                  <span className="font-bold text-gray-900 text-xs">
                    {new Date(selectedPayout.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 pt-2">
                {selectedPayout.status === 'paid' && (
                  <Button variant="outline" className="flex-1 gap-1" onClick={() => handleDownloadReceipt(selectedPayout)}>
                    <Download className="w-3.5 h-3.5" />دانلود رسید
                  </Button>
                )}
                <Button variant="outline" className="flex-1 gap-1" onClick={() => window.print()}>
                  <FileText className="w-3.5 h-3.5" />چاپ
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}