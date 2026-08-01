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
    <div className="bg-white rounded-xl border border-accent-200 p-3 mb-3 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-accent-600" />
          دستگاه‌های خود را انتخاب کنید
        </h3>
        <div className="flex items-center gap-2">
          {selectedDeviceIds.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[10px] text-error-600 hover:text-error-700 font-bold flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />
              پاک کردن
            </button>
          )}
          {devices.length > 0 && (
            <button
              onClick={onSelectAll}
              className="text-[10px] text-primary-600 hover:text-primary-700 font-bold"
            >
              انتخاب همه
            </button>
          )}
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Smartphone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-2">هنوز دستگاهی ثبت نکرده‌اید</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/devices')}>
            افزودن دستگاه
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {devices.map((device) => {
            const isSelected = selectedDeviceIds.includes(device.device_model_id);
            return (
              <button
                key={device.id}
                onClick={() => onToggleDevice(device.device_model_id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border-2',
                  isSelected
                    ? 'bg-gradient-to-r from-accent-50 to-accent-100 border-accent-500 text-accent-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-accent-300'
                )}
              >
                {isSelected && <CheckCircle className="w-3 h-3 text-accent-600" />}
                <span className="text-primary-600 font-bold">{device.device_model?.brand?.name}</span>
                <span>{device.device_model?.name}</span>
                {device.nickname && (
                  <span className="text-[10px] text-gray-500">({device.nickname})</span>
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
