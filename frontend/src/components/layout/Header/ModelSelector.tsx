import { memo } from 'react';
import { CheckCircle, Edit2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getDeviceTypeIcon, getDeviceTypeLabel } from '@/utils/deviceType';
import { useUserDevices } from '@/hooks/useUserDevices';
import { useAuthStore } from '@/store/authStore';
import type { ModelData } from './types';

interface ModelSelectorProps {
  selectedModel: ModelData | null;
  isScrolled: boolean;
  onOpenModal: () => void;
}

// ✅ قبلاً onClearSelection?: () => void اینجا تعریف و دریافت می‌شد ولی نه
// در بدنه‌ی این کامپوننت استفاده می‌شد و نه هیچ‌جای دیگری آن را پاس
// می‌داد — چون خودِ ModelSelectorModal با clearSelection از useModelStore
// از قبل امکان تغییر/پاک‌کردن انتخاب را می‌دهد، این یک پراپ کاملاً مرده بود.
export const ModelSelector = memo(({
  selectedModel,
  isScrolled,
  onOpenModal,
}: ModelSelectorProps) => {
  // این مدال دیگر فقط موبایل نیست — لپ‌تاپ و تبلت را هم پشتیبانی می‌کند، پس
  // برچسب و آیکون باید با نوعِ واقعیِ دستگاه انتخابی هماهنگ باشند، نه اینکه
  // همه‌جا فرض شود «گوشی».
  const deviceType = selectedModel?.brand?.type;
  const deviceLabel = getDeviceTypeLabel(deviceType);
  const DeviceIcon = getDeviceTypeIcon(deviceType);

  // ✅ سناریو B: دکمه‌ی ذخیره/حذف دستگاه فعلی در «دستگاه‌های من»، مستقیم از
  // هدر — بدون باز کردن مودال.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isDeviceSaved, getDeviceByModelId, addDevice, removeDevice, isAdding, isRemoving } = useUserDevices();

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedModel || !isAuthenticated) return;
    const saved = getDeviceByModelId(selectedModel.id);
    if (saved) {
      await removeDevice(saved.id);
    } else {
      await addDevice(selectedModel.id);
    }
  };

  if (selectedModel) {
    const isSaved = isAuthenticated && isDeviceSaved(selectedModel.id);

    return (
      <div
        className={cn(
          'flex items-center gap-1 rounded-xl transition-all group',
          isScrolled
            ? 'pr-1 pl-1 py-1 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
            : 'pr-1.5 pl-2 py-1.5 bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 border-2 border-success-200 dark:border-success-800 hover:border-success-300 dark:hover:border-success-700 hover:shadow-md'
        )}
      >
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2"
          aria-label={`تغییر ${deviceLabel} از ${selectedModel.name}`}
        >
          <div
            className={cn(
              'bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform',
              isScrolled ? 'w-7 h-7' : 'w-8 h-8'
            )}
          >
            <CheckCircle className={cn('text-white', isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          </div>

          <div className="text-right">
            <p className={cn('text-success-600 dark:text-success-400 font-bold', isScrolled ? 'text-[9px]' : 'text-[10px]')}>
              {deviceLabel} شما:
            </p>
            <p className={cn('font-black text-gray-900 dark:text-white truncate', isScrolled ? 'text-[10px] max-w-[80px]' : 'text-xs max-w-[120px]')}>
              {selectedModel.name}
            </p>
          </div>

          {!isScrolled && (
            <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
          )}
        </button>

        {isAuthenticated && (
          <button
            onClick={handleToggleSave}
            disabled={isAdding || isRemoving}
            className={cn(
              // ✅ قبلاً این دکمه فقط یک آیکون کوچک هم‌رنگ با پس‌زمینه‌ی
              // success بود (خاکستری کم‌رنگ در حالت ذخیره‌نشده) که عملاً در
              // کنار نشان بزرگ CheckCircle دیده نمی‌شد. طبق درخواست کاربر
              // («مشهورتر و رنگش متفاوتر»)، رنگ warning (طلایی/کهربایی —
              // همان زبان بصری آیکون بوکمارک/ستاره در بقیه‌ی پروژه) و اندازه‌ی
              // بزرگ‌تر با پس‌زمینه‌ی توپر انتخاب شد تا از success (تایید
              // انتخاب دستگاه) و primary (CTA اصلی) کاملاً متمایز باشد.
              'flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
              isScrolled ? 'w-8 h-8' : 'w-9 h-9',
              isSaved
                ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white shadow-sm shadow-warning-500/40 hover:from-warning-500 hover:to-warning-600 hover:scale-105'
                : 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 border border-warning-200 dark:border-warning-800 hover:bg-warning-100 dark:hover:bg-warning-900/50 hover:scale-105 animate-pulse-soft'
            )}
            aria-label={isSaved ? 'حذف از دستگاه‌های من' : 'افزودن به دستگاه‌های من'}
            title={isSaved ? 'حذف از دستگاه‌های من' : 'افزودن به دستگاه‌های من'}
          >
            {isSaved ? (
              <BookmarkCheck className={isScrolled ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
            ) : (
              <BookmarkPlus className={isScrolled ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onOpenModal}
      className={cn(
        'flex items-center gap-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/30 group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        isScrolled
          ? 'px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white'
          : 'px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:-translate-y-0.5'
      )}
      aria-label="انتخاب دستگاه"
    >
      <DeviceIcon className={cn('group-hover:scale-110 transition-transform', isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      {!isScrolled && 'دستگاه خود را انتخاب کنید'}
    </button>
  );
});

ModelSelector.displayName = 'ModelSelector';
