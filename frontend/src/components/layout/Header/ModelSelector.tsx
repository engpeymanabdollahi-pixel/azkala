import { memo } from 'react';
import { CheckCircle, Edit3, Plus, Smartphone } from 'lucide-react';
import { cn } from '@/utils/cn';
import { resolveDeviceLabel, resolveDeviceIcon } from '@/utils/deviceType';
import { useUserDevices } from '@/hooks/useUserDevices';
import { useAuthStore } from '@/store/authStore';
import type { ModelData } from './types';

interface ModelSelectorProps {
  selectedModel: ModelData | null;
  isScrolled: boolean;
  onOpenModal: () => void;
}

// ==================== Sub-Components ====================

/**
 * SaveButton - دکمه ذخیره/حذف دستگاه
 * فقط آیکون + طلایی با سایه سه بعدی (بدون کادر و مربع)
 */
function SaveButton({
  isSaved,
  onClick,
  isLoading,
  isScrolled,
}: {
  isSaved: boolean;
  onClick: (e: React.MouseEvent) => void;
  isLoading: boolean;
  isScrolled: boolean;
}) {
  const size = isScrolled ? 'w-5 h-5' : 'w-6 h-6';
  const shadowClass = isSaved
    ? 'drop-shadow-[0_2px_3px_rgba(217,119,6,0.7)]'
    : 'drop-shadow-[0_2px_4px_rgba(217,119,6,0.5)]';

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 ease-out',
        'focus:outline-none focus:scale-125',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
        'hover:scale-125 active:scale-90',
        'group relative'
      )}
      aria-label={isSaved ? 'حذف از دستگاه‌های من' : 'افزودن به دستگاه‌های من'}
      title={isSaved ? 'حذف از دستگاه‌های من' : 'افزودن به دستگاه‌های من'}
    >
      {isLoading ? (
        <div
          className={cn(
            'border-[2.5px] border-amber-500 border-t-transparent rounded-full animate-spin',
            size
          )}
        />
      ) : isSaved ? (
        <CheckCircle
          className={cn(
            'text-amber-500 transition-all duration-300',
            shadowClass,
            size
          )}
          strokeWidth={2.5}
          fill="currentColor"
          fillOpacity={0.15}
        />
      ) : (
        <Plus
          className={cn(
            'text-amber-500 transition-all duration-300',
            shadowClass,
            size
          )}
          strokeWidth={3}
        />
      )}

      {/* Tooltip در desktop (فقط hover) */}
      {!isScrolled && (
        <span
          className={cn(
            'absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap',
            'px-2 py-1 rounded-md text-[10px] font-bold',
            'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'pointer-events-none z-50'
          )}
        >
          {isSaved ? 'حذف از دستگاه‌ها' : 'افزودن به دستگاه‌ها'}
        </span>
      )}
    </button>
  );
}

/**
 * DevicePill - نمایش دستگاه انتخاب شده با قابلیت Edit
 */
function DevicePill({
  selectedModel,
  deviceLabel,
  DeviceIcon,
  onOpenModal,
  isScrolled,
}: {
  selectedModel: ModelData;
  deviceLabel: string;
  DeviceIcon: any;
  onOpenModal: () => void;
  isScrolled: boolean;
}) {
  return (
    <button
      onClick={onOpenModal}
      className={cn(
        'flex items-center gap-2 rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2',
        'group/pill',
        isScrolled ? 'px-1.5 py-1' : 'px-2 py-1.5'
      )}
      aria-label={`تغییر ${deviceLabel} از ${selectedModel.name}`}
    >
      {/* آیکون دستگاه در دایره سبز */}
      <div
        className={cn(
          'bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-sm',
          'group-hover/pill:scale-110 group-hover/pill:shadow-md transition-all',
          isScrolled ? 'w-6 h-6' : 'w-7 h-7'
        )}
      >
        <DeviceIcon className={cn('text-white', isScrolled ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      </div>

      {/* متن دستگاه */}
      <div className="text-right min-w-0">
        <p
          className={cn(
            'text-success-700 dark:text-success-400 font-bold leading-tight',
            isScrolled ? 'text-[9px]' : 'text-[10px]'
          )}
        >
          {deviceLabel} شما:
        </p>
        <p
          className={cn(
            'font-black text-gray-900 dark:text-white truncate leading-tight',
            isScrolled ? 'text-[10px] max-w-[70px]' : 'text-xs max-w-[110px]'
          )}
        >
          {selectedModel.name}
        </p>
      </div>

      {/* آیکون Edit (فقط وقتی scrolled نیست) */}
      {!isScrolled && (
        <Edit3
          className={cn(
            'w-3 h-3 text-gray-400 flex-shrink-0',
            'group-hover/pill:text-primary-600 dark:group-hover/pill:text-primary-400',
            'transition-colors'
          )}
        />
      )}
    </button>
  );
}

/**
 * EmptyState - وقتی هیچ دستگاهی انتخاب نشده
 */
function EmptyState({
  onOpenModal,
  DeviceIcon,
  isScrolled,
}: {
  onOpenModal: () => void;
  DeviceIcon: any;
  isScrolled: boolean;
}) {
  return (
    <button
      onClick={onOpenModal}
      className={cn(
        'flex items-center gap-2 rounded-lg font-bold transition-all duration-200',
        'shadow-lg shadow-primary-500/30 group',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
        'hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:-translate-y-0.5',
        'active:translate-y-0 active:shadow-md',
        isScrolled ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
      )}
      aria-label="انتخاب دستگاه"
    >
      <DeviceIcon
        className={cn(
          'group-hover:scale-110 group-hover:rotate-12 transition-transform',
          isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'
        )}
      />
      <span className="hidden sm:inline">
        {isScrolled ? 'انتخاب' : 'دستگاه خود را انتخاب کنید'}
      </span>
    </button>
  );
}

// ==================== Main Component ====================

export const ModelSelector = memo(
  ({ selectedModel, isScrolled, onOpenModal }: ModelSelectorProps) => {
    // ✅ فاز ۸: بعد از مهاجرت localize_device_families_name، family.name
    // فارسی است («گوشی»/«لپ‌تاپ»/«تبلت») — برچسب هم مثل آیکون (فاز ۵)
    // family-first resolve می‌شود؛ type فقط fallback سازگاری باقی می‌ماند.
    const deviceLabel = resolveDeviceLabel(selectedModel?.brand);
    const DeviceIcon = resolveDeviceIcon(selectedModel?.brand) || Smartphone;

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const {
      isDeviceSaved,
      getDeviceByModelId,
      addDevice,
      removeDevice,
      isAdding,
      isRemoving,
    } = useUserDevices();

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

    const isSaved = isAuthenticated && selectedModel && isDeviceSaved(selectedModel.id);
    const isLoading = isAdding || isRemoving;

    // ========== حالت ۱: هیچ دستگاهی انتخاب نشده ==========
    if (!selectedModel) {
      return (
        <EmptyState
          onOpenModal={onOpenModal}
          DeviceIcon={DeviceIcon}
          isScrolled={isScrolled}
        />
      );
    }

    // ========== حالت ۲: دستگاه انتخاب شده ==========
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-xl transition-all duration-300',
          isScrolled
            ? 'pl-1 pr-1 py-1 bg-success-50/70 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
            : 'pl-2 pr-1.5 py-1.5 bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 border-2 border-success-200 dark:border-success-800 hover:border-success-300 dark:hover:border-success-700 hover:shadow-md'
        )}
      >
        {/* نمایش دستگاه + Edit */}
        <DevicePill
          selectedModel={selectedModel}
          deviceLabel={deviceLabel}
          DeviceIcon={DeviceIcon}
          onOpenModal={onOpenModal}
          isScrolled={isScrolled}
        />

        {/* جداکننده */}
        {isAuthenticated && (
          <div
            className={cn(
              'w-px bg-success-200 dark:bg-success-800',
              isScrolled ? 'h-5' : 'h-7'
            )}
          />
        )}

        {/* دکمه ذخیره: فقط + طلایی بدون کادر */}
        {isAuthenticated && (
          <div className="px-1">
            <SaveButton
              isSaved={!!isSaved}
              onClick={handleToggleSave}
              isLoading={isLoading}
              isScrolled={isScrolled}
            />
          </div>
        )}
      </div>
    );
  }
);

ModelSelector.displayName = 'ModelSelector';