import { memo } from 'react';
import { CheckCircle, Edit2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getDeviceTypeIcon, getDeviceTypeLabel } from '@/utils/deviceType';
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

  if (selectedModel) {
    return (
      <button
        onClick={onOpenModal}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-all group focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2',
          isScrolled
            ? 'px-3 py-2 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
            : 'px-4 py-2.5 bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 border-2 border-success-200 dark:border-success-800 hover:border-success-300 dark:hover:border-success-700 hover:shadow-md'
        )}
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
