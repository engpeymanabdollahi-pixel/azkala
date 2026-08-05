import { useNavigate } from 'react-router-dom';
import { Smartphone, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { UserDevice } from '../types';

interface DeviceSelectorProps {
  devices: UserDevice[];
  selectedDeviceIds: number[];
  onToggleDevice: (deviceId: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

/**
 * کامپوننت انتخاب چندگانه دستگاه‌های کاربر
 */
export function DeviceSelector({
  devices,
  selectedDeviceIds,
  onToggleDevice,
  onSelectAll,
  onClearAll,
}: DeviceSelectorProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-accent-200 dark:border-accent-800 p-3 mb-3 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
          دستگاه‌های خود را انتخاب کنید
        </h3>
        <div className="flex items-center gap-2">
          {selectedDeviceIds.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[10px] text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 font-bold flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />
              پاک کردن
            </button>
          )}
          {devices.length > 0 && (
            <button
              onClick={onSelectAll}
              className="text-[10px] text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold"
            >
              انتخاب همه
            </button>
          )}
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
          <Smartphone className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">هنوز دستگاهی ثبت نکرده‌اید</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/devices')}>
            افزودن دستگاه
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {devices.map((device) => {
            // ✅ فیکس واقعی: قبلاً اینجا device.device_model_id/device_model خوانده
            // می‌شد — فیلدی که نه در تایپ UserDevice و نه در پاسخ واقعی
            // /user/devices وجود دارد (ستون واقعی و رابطه‌ی واقعی
            // phone_model_id/phone_model است). نتیجه: isSelected همیشه false
            // بود، کلیک روی دکمه یک ID نامعتبر (undefined) را toggle می‌کرد و
            // نام برند/مدل هر دستگاه همیشه خالی نمایش داده می‌شد.
            const isSelected = selectedDeviceIds.includes(device.phone_model_id);
            return (
              <button
                key={device.id}
                onClick={() => onToggleDevice(device.phone_model_id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border-2',
                  isSelected
                    ? 'bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/30 border-accent-500 text-accent-700 dark:text-accent-300 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-accent-300 dark:hover:border-accent-600'
                )}
              >
                {isSelected && <CheckCircle className="w-3 h-3 text-accent-600 dark:text-accent-400" />}
                <span className="text-primary-600 dark:text-primary-400 font-bold">{device.phone_model?.brand?.name}</span>
                <span>{device.phone_model?.name}</span>
                {device.nickname && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">({device.nickname})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default DeviceSelector;
