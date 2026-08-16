import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Users, ChevronRight, ChevronLeft, X, Award, List, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { ReferralRulesPanel } from './referral/ReferralRulesPanel';
import {
  adminReferralService,
  type AdminReferralFilters,
  type AdminReferralListItem,
} from '@/services/api/adminReferral.service';

const STATUS_META: Record<AdminReferralListItem['status'], { label: string; variant: 'gray' | 'primary' | 'success' | 'error' }> = {
  pending: { label: 'در انتظار', variant: 'gray' },
  qualified: { label: 'واجد شرایط', variant: 'primary' },
  rewarded: { label: 'پاداش‌دار', variant: 'success' },
  cancelled: { label: 'لغو شده', variant: 'error' },
  rejected: { label: 'رد شده', variant: 'error' },
};

/**
 * Referral System — Phase 3 (Admin Module — MVP: صرفاً نمایش/ممیزی).
 * دقیقاً هم‌الگو با AdminStoresPage: دسترسی این صفحه از طریق permission
 * «referrals.view» — همان سیستم Multi-Admin موجود — gate می‌شود
 * (middleware سمت بک‌اند و فیلتر سایدبار سمت فرانت). هیچ عملیات
 * نوشتنی‌ای (ویرایش/ابطال پاداش) در این نسخه نیست.
 */
export default function AdminReferralsPage() {
  const [tab, setTab] = useState<'referrals' | 'rules'>('referrals');
  const [status, setStatus] = useState<AdminReferralFilters['status']>('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-referrals', status, page],
    queryFn: () => adminReferralService.list({ status: status || undefined, page, per_page: 20 }),
    enabled: tab === 'referrals',
  });

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-referral-detail', detailId],
    queryFn: () => adminReferralService.detail(detailId as number),
    enabled: detailId !== null,
  });

  const referrals = data?.referrals.data ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const statusOptions: Array<{ key: AdminReferralFilters['status']; label: string }> = [
    { key: '', label: 'همه' },
    { key: 'pending', label: 'در انتظار' },
    { key: 'qualified', label: 'واجد شرایط' },
    { key: 'rewarded', label: 'پاداش‌دار' },
    { key: 'cancelled', label: 'لغو شده' },
    { key: 'rejected', label: 'رد شده' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          معرفی دوستان (Referral)
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          نمایش و ممیزی معرفی‌ها و پاداش‌های پرداخت‌شده، و مدیریت قوانین پاداش سطحی (Referral Rule Engine).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-1 w-fit">
        <button
          onClick={() => setTab('referrals')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors',
            tab === 'referrals'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          )}
        >
          <List className="w-4 h-4" />
          لیست معرفی‌ها
        </button>
        <button
          onClick={() => setTab('rules')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors',
            tab === 'rules'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          )}
        >
          <Layers className="w-4 h-4" />
          قوانین پاداش سطحی
        </button>
      </div>

      {tab === 'rules' && <ReferralRulesPanel />}

      {tab === 'referrals' && (
        <>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> کل معرفی‌ها</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{summary.total_referrals.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">در انتظار</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{summary.pending.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">پاداش‌دار</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{summary.rewarded.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 border border-success-100 dark:border-success-800">
            <p className="text-[10px] text-success-700 dark:text-success-400 flex items-center gap-1"><Award className="w-3 h-3" /> مجموع پاداش پرداختی</p>
            <p className="text-sm font-black text-success-700 dark:text-success-400">{formatPrice(summary.total_reward_amount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {statusOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setStatus(opt.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              status === opt.key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && referrals.length === 0 && (
        <EmptyState icon={<Gift className="w-10 h-10" />} title="معرفی‌ای یافت نشد" description="در این فیلتر هیچ Referral ای ثبت نشده است." />
      )}

      <div className="space-y-2">
        {referrals.map((referral) => (
          <button
            key={referral.id}
            onClick={() => setDetailId(referral.id)}
            className="w-full text-right bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md transition-shadow"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {referral.referrer?.name ?? 'کاربر حذف‌شده'} ← {referral.referred?.name ?? 'کاربر حذف‌شده'}
                </p>
                <Badge variant={STATUS_META[referral.status].variant}>{STATUS_META[referral.status].label}</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                کد: {referral.referral_code} — ثبت‌نام: {new Date(referral.registered_at).toLocaleDateString('fa-IR')}
              </p>
            </div>

            {referral.reward && (
              <p className="text-sm font-black text-success-600 dark:text-success-400 flex-shrink-0">
                {formatPrice(referral.reward.amount)}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Pagination */}
      {referrals.length > 0 && pagination && (
        <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            نمایش {referrals.length} مورد از {pagination.total} مورد
          </p>
          {pagination.last_page > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.current_page === 1} className="gap-1">
                <ChevronRight className="w-4 h-4" />
                قبلی
              </Button>
              <span className="text-xs text-gray-600 dark:text-gray-300 px-2">
                صفحه {pagination.current_page.toLocaleString('fa-IR')} از {pagination.last_page.toLocaleString('fa-IR')}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page === pagination.last_page} className="gap-1">
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setDetailId(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">جزئیات معرفی</h2>
              <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading && (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            )}

            {detail && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">وضعیت</span>
                  <Badge variant={STATUS_META[detail.status].variant}>{STATUS_META[detail.status].label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">کد معرف</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tracking-widest">{detail.referral_code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">معرف</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{detail.referrer?.name ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">معرفی‌شده</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{detail.referred?.name ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">تاریخ ثبت‌نام</span>
                  <span className="text-gray-700 dark:text-gray-300">{new Date(detail.registered_at).toLocaleDateString('fa-IR')}</span>
                </div>
                {detail.qualified_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">تاریخ واجد شرایط شدن</span>
                    <span className="text-gray-700 dark:text-gray-300">{new Date(detail.qualified_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                )}
                {detail.reward && (
                  <>
                    <hr className="border-gray-100 dark:border-slate-700" />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">مبلغ پاداش</span>
                      <span className="font-black text-success-600 dark:text-success-400">{formatPrice(detail.reward.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">تاریخ پرداخت پاداش</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {detail.reward.rewarded_at ? new Date(detail.reward.rewarded_at).toLocaleDateString('fa-IR') : '—'}
                      </span>
                    </div>
                    {detail.qualifying_order && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">سفارش صلاحیت‌دار</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{detail.qualifying_order.order_number}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
