import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Power, Award, Ticket, Wallet, History, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/utils/format';
import {
  adminReferralRuleService,
  type ReferralRewardRule,
  type ReferralRewardType,
  type ReferralRuleFormInput,
} from '@/services/api/adminReferralRule.service';

const TYPE_META: Record<ReferralRewardType, { label: string; icon: typeof Wallet }> = {
  fixed_credit: { label: 'اعتبار ثابت', icon: Wallet },
  fixed_coupon: { label: 'کد تخفیف ثابت', icon: Ticket },
  percentage_coupon: { label: 'کد تخفیف درصدی', icon: Ticket },
};

const emptyForm: ReferralRuleFormInput = {
  milestone: 10,
  reward_type: 'fixed_credit',
  reward_value: 100000,
  min_order_amount: null,
  max_discount: null,
  coupon_expiration_days: 30,
  usage_limit: 1,
  repeatable: false,
  priority: 0,
  is_active: true,
  description: '',
};

/**
 * پنل «قوانین پاداش سطحی معرفی» — Referral Rule Engine (Part 4 audit).
 * ✅ REUSE: از همان Coupon/Wallet-ledger موجود استفاده می‌کند (رجوع به
 * ReferralRuleEngineService سمت بک‌اند) — هیچ سیستم پرداخت جدیدی اینجا
 * ساخته نشده، فقط CRUD روی قوانینِ trigger این سیستم موجود.
 */
export function ReferralRulesPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ReferralRewardRule | null>(null);
  const [form, setForm] = useState<ReferralRuleFormInput>(emptyForm);
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-referral-rules'],
    queryFn: () => adminReferralRuleService.list(),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-referral-rule-triggers'],
    queryFn: () => adminReferralRuleService.triggerHistory(),
    enabled: showHistory,
  });

  const rules = data?.data ?? [];
  const stats = data?.stats;

  const errorMessage = (error: unknown, fallback: string) => {
    const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
    const firstFieldError = axiosError.response?.data?.errors
      ? Object.values(axiosError.response.data.errors)[0]?.[0]
      : undefined;
    return firstFieldError || axiosError.response?.data?.message || fallback;
  };

  const createMutation = useMutation({
    mutationFn: (payload: ReferralRuleFormInput) => adminReferralRuleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-rules'] });
      toast.success('قانون جدید ثبت شد', { icon: '✅' });
      closeForm();
    },
    onError: (error) => toast.error(errorMessage(error, 'خطا در ثبت قانون')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReferralRuleFormInput }) => adminReferralRuleService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-rules'] });
      toast.success('قانون به‌روزرسانی شد', { icon: '✅' });
      closeForm();
    },
    onError: (error) => toast.error(errorMessage(error, 'خطا در ویرایش قانون')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminReferralRuleService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-rules'] });
      toast.success('قانون حذف شد');
    },
    onError: (error) => toast.error(errorMessage(error, 'خطا در حذف قانون')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminReferralRuleService.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referral-rules'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'خطا در تغییر وضعیت')),
  });

  const openCreate = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (rule: ReferralRewardRule) => {
    setEditingRule(rule);
    setForm({
      milestone: rule.milestone,
      reward_type: rule.reward_type,
      reward_value: Number(rule.reward_value),
      min_order_amount: rule.min_order_amount ? Number(rule.min_order_amount) : null,
      max_discount: rule.max_discount ? Number(rule.max_discount) : null,
      coupon_expiration_days: rule.coupon_expiration_days,
      usage_limit: rule.usage_limit,
      repeatable: rule.repeatable,
      priority: rule.priority,
      is_active: rule.is_active,
      description: rule.description ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isCouponType = form.reward_type === 'fixed_coupon' || form.reward_type === 'percentage_coupon';
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">کل قوانین</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stats.total_rules.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">فعال</p>
            <p className="text-lg font-black text-success-600 dark:text-success-400">{stats.active_rules.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><Award className="w-3 h-3" /> کل trigger ها</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stats.total_triggers.toLocaleString('fa-IR')}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"><Ticket className="w-3 h-3" /> کوپن صادرشده</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stats.coupons_issued.toLocaleString('fa-IR')}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          هر بار که یک معرف به تعداد مشخصی «معرفی موفق» برسد، پاداش این قانون خودکار صادر می‌شود.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory((v) => !v)} className="gap-1.5">
            <History className="w-4 h-4" />
            تاریخچه
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            قانون جدید
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && rules.length === 0 && (
        <EmptyState icon={<Award className="w-10 h-10" />} title="هنوز قانونی تعریف نشده" description="با «قانون جدید» اولین سطح پاداش معرفی را بسازید." />
      )}

      <div className="space-y-2">
        {rules.map((rule) => {
          const Icon = TYPE_META[rule.reward_type].icon;
          return (
            <div
              key={rule.id}
              className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      در {rule.milestone.toLocaleString('fa-IR')} معرفی موفق{rule.repeatable ? ' (تکرارشونده)' : ''}
                    </p>
                    <Badge variant={rule.is_active ? 'success' : 'gray'}>{rule.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {TYPE_META[rule.reward_type].label} —{' '}
                    {rule.reward_type === 'percentage_coupon'
                      ? `${Number(rule.reward_value).toLocaleString('fa-IR')}٪`
                      : `${formatPrice(Number(rule.reward_value))} تومان`}
                    {rule.triggers_count ? ` — ${rule.triggers_count.toLocaleString('fa-IR')} بار صادر شده` : ''}
                  </p>
                  {rule.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rule.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => toggleMutation.mutate(rule.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
                  title={rule.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(rule)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-primary-600 dark:text-primary-400"
                  title="ویرایش"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`قانون سطح ${rule.milestone} حذف شود؟`)) deleteMutation.mutate(rule.id);
                  }}
                  className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 text-error-600 dark:text-error-400"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trigger History */}
      {showHistory && (
        <div className="mt-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <History className="w-4 h-4" />
              تاریخچه‌ی پاداش‌های سطحی صادرشده
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (history?.data.length ?? 0) === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">هنوز هیچ پاداش سطحی صادر نشده است.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {history?.data.map((t) => (
                <div key={t.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{t.referrer?.name ?? 'کاربر حذف‌شده'}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      سطح {t.successful_referrals_count_at_trigger.toLocaleString('fa-IR')} — {new Date(t.created_at).toLocaleDateString('fa-IR')}
                      {t.coupon && ` — کد: ${t.coupon.code}`}
                    </p>
                  </div>
                  <p className="font-black text-success-600 dark:text-success-400">
                    {t.reward_type === 'percentage_coupon' ? `${t.reward_value}٪` : `${formatPrice(Number(t.reward_value))} ت`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeForm}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">{editingRule ? 'ویرایش قانون' : 'قانون جدید'}</h2>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">تعداد معرفی موفق لازم (milestone)</label>
              <input
                type="number"
                min={1}
                required
                value={form.milestone}
                onChange={(e) => setForm({ ...form, milestone: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">نوع پاداش</label>
              <select
                value={form.reward_type}
                onChange={(e) => setForm({ ...form, reward_type: e.target.value as ReferralRewardType })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="fixed_credit">اعتبار ثابت (لجر پاداش)</option>
                <option value="fixed_coupon">کد تخفیف با مبلغ ثابت</option>
                <option value="percentage_coupon">کد تخفیف درصدی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                {form.reward_type === 'percentage_coupon' ? 'درصد تخفیف' : 'مبلغ (تومان)'}
              </label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                required
                value={form.reward_value}
                onChange={(e) => setForm({ ...form, reward_value: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            {isCouponType && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">حداقل مبلغ سفارش</label>
                    <input
                      type="number"
                      min={0}
                      value={form.min_order_amount ?? ''}
                      onChange={(e) => setForm({ ...form, min_order_amount: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  {form.reward_type === 'percentage_coupon' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">حداکثر تخفیف</label>
                      <input
                        type="number"
                        min={0}
                        value={form.max_discount ?? ''}
                        onChange={(e) => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">اعتبار کوپن (روز)</label>
                    <input
                      type="number"
                      min={1}
                      value={form.coupon_expiration_days ?? ''}
                      onChange={(e) => setForm({ ...form, coupon_expiration_days: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">محدودیت استفاده</label>
                    <input
                      type="number"
                      min={1}
                      value={form.usage_limit ?? ''}
                      onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.repeatable ?? false}
                onChange={(e) => setForm({ ...form, repeatable: e.target.checked })}
                className="rounded border-gray-300 dark:border-slate-500"
              />
              تکرارشونده (هر {form.milestone.toLocaleString('fa-IR')} معرفی یک‌بار، نه فقط یک‌بار برای کل عمر معرف)
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-gray-300 dark:border-slate-500"
              />
              فعال
            </label>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">توضیح (اختیاری)</label>
              <input
                type="text"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" isLoading={isSaving} className="flex-1">
                {editingRule ? 'ذخیره تغییرات' : 'ثبت قانون'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                انصراف
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
