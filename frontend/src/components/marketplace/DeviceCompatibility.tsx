import { memo } from 'react';
import { CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { cn } from '@/utils/cn';
import { resolveDeviceIcon } from '@/utils/deviceType';
import type { PhoneModel } from '@/types/models';

/**
 * DeviceCompatibility Component
 *
 * نمایش لیست دستگاه‌های سازگار/ناسازگار با یک محصول
 * این کامپوننت "هویت واقعی Design System ازکالا" است.
 *
 * Features:
 * - نمایش ✓ سازگار و ✕ ناسازگار
 * - آیکون‌های مختلف بر اساس نوع دستگاه
 * - حالت‌های مختلف: list, compact, badge
 * - فیلتر بر اساس سازگاری
 * - RTL-first
 *
 * مثال استفاده:
 * <DeviceCompatibility
 *   devices={product.compatible_models}
 *   selectedDevice={selectedModel}
 *   variant="list"
 * />
 */

export type CompatibilityVariant = 'list' | 'compact' | 'inline';

interface DeviceCompatibilityProps {
  /** لیست دستگاه‌های سازگار با محصول */
  devices: PhoneModel[] | undefined;

  /** دستگاه انتخاب شده توسط کاربر (برای هایلایت کردن) */
  selectedDevice?: PhoneModel | null;

  /** حالت نمایش */
  variant?: CompatibilityVariant;

  /** حداکثر تعداد نمایش (در حالت compact) */
  maxDisplay?: number;

  /** کلاس اضافی */
  className?: string;

  /** کلیک روی دستگاه */
  onDeviceClick?: (device: PhoneModel) => void;
}

export const DeviceCompatibility = memo(function DeviceCompatibility({
  devices,
  selectedDevice,
  variant = 'list',
  maxDisplay = 4,
  className,
  onDeviceClick,
}: DeviceCompatibilityProps) {
  if (!devices || devices.length === 0) {
    return (
      <div className={cn(
        'text-center py-4 px-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700',
        className
      )}>
        <Smartphone className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          اطلاعات سازگاری موجود نیست
        </p>
      </div>
    );
  }

  // بررسی اینکه آیا دستگاه انتخابی کاربر با این محصول سازگار است
  const isCompatibleWithSelected = selectedDevice
    ? devices.some((d) => d.id === selectedDevice.id)
    : null;

  // حالت inline (فقط badge سازگاری با دستگاه انتخابی)
  if (variant === 'inline') {
    if (!selectedDevice) return null;

    if (isCompatibleWithSelected) {
      return (
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg',
          'bg-success-50 dark:bg-success-900/30',
          'text-success-700 dark:text-success-300',
          'text-xs font-bold',
          className
        )}>
          <CheckCircle className="w-3.5 h-3.5" />
          <span>سازگار با {selectedDevice.name}</span>
        </div>
      );
    }

    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg',
        'bg-error-50 dark:bg-error-900/30',
        'text-error-700 dark:text-error-300',
        'text-xs font-bold',
        className
      )}>
        <XCircle className="w-3.5 h-3.5" />
        <span>ناسازگار با {selectedDevice.name}</span>
      </div>
    );
  }

  // حالت compact (نمایش چند تا + "و N دستگاه دیگر")
  if (variant === 'compact') {
    const displayDevices = devices.slice(0, maxDisplay);
    const remainingCount = devices.length - maxDisplay;

    return (
      <div className={cn('space-y-1.5', className)}>
        {displayDevices.map((device) => (
          <CompactDeviceItem
            key={device.id}
            device={device}
            isSelected={selectedDevice?.id === device.id}
            onClick={onDeviceClick}
          />
        ))}
        {remainingCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
            و {remainingCount} دستگاه دیگر
          </p>
        )}
      </div>
    );
  }

  // حالت list (کامل)
  return (
    <div className={cn('space-y-2', className)}>
      {/* هدر با اطلاعات کلی */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            سازگاری با دستگاه‌ها
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {devices.length} دستگاه
        </span>
      </div>

      {/* وضعیت سازگاری با دستگاه انتخابی (اگر وجود دارد) */}
      {selectedDevice && (
        <div className={cn(
          'flex items-center gap-2 p-2.5 rounded-lg border-2 mb-3',
          isCompatibleWithSelected
            ? 'bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700'
            : 'bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-700'
        )}>
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            isCompatibleWithSelected
              ? 'bg-success-500'
              : 'bg-error-500'
          )}>
            {isCompatibleWithSelected
              ? <CheckCircle className="w-5 h-5 text-white" />
              : <XCircle className="w-5 h-5 text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-xs font-bold',
              isCompatibleWithSelected
                ? 'text-success-700 dark:text-success-300'
                : 'text-error-700 dark:text-error-300'
            )}>
              {isCompatibleWithSelected
                ? '✓ این محصول با دستگاه شما سازگار است'
                : '✕ این محصول با دستگاه شما سازگار نیست'
              }
            </p>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
              {selectedDevice.brand?.name} {selectedDevice.name}
            </p>
          </div>
        </div>
      )}

      {/* لیست دستگاه‌ها */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
        {devices.map((device) => {
          const Icon = resolveDeviceIcon(device.brand);
          const isSelected = selectedDevice?.id === device.id;

          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onDeviceClick?.(device)}
              disabled={!onDeviceClick}
              className={cn(
                'w-full flex items-center gap-2.5 p-2.5 rounded-lg text-right transition-all',
                'border',
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                  : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700',
                onDeviceClick && 'cursor-pointer hover:shadow-sm',
                !onDeviceClick && 'cursor-default'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isSelected
                  ? 'bg-primary-500'
                  : 'bg-gray-100 dark:bg-slate-700'
              )}>
                <Icon className={cn(
                  'w-4 h-4',
                  isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-bold truncate',
                  isSelected
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-900 dark:text-gray-100'
                )}>
                  {device.name}
                </p>
                {device.brand?.name && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {device.brand.name}
                  </p>
                )}
              </div>

              <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ==================== Sub-components ====================

/**
 * CompactDeviceItem - یک آیتم کوچک برای حالت compact
 */
function CompactDeviceItem({
  device,
  isSelected,
  onClick,
}: {
  device: PhoneModel;
  isSelected: boolean;
  onClick?: (device: PhoneModel) => void;
}) {
  const Icon = resolveDeviceIcon(device.brand);

  return (
    <button
      type="button"
      onClick={() => onClick?.(device)}
      disabled={!onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-right transition-all',
        'border',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
          : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700',
        onClick && 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700'
      )}
    >
      <Icon className={cn(
        'w-3.5 h-3.5 flex-shrink-0',
        isSelected ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'
      )} />
      <span className="flex-1 text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
        {device.name}
      </span>
      <CheckCircle className="w-3.5 h-3.5 text-success-500 flex-shrink-0" />
    </button>
  );
}