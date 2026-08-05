import { useState, useEffect } from 'react';
import { X, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

interface HistoryEntry {
  id: number;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export function ProductHistoryModal({ isOpen, onClose, productId, productName }: HistoryModalProps) {
  const [histories, setHistories] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/seller/products/${productId}/history`);
      setHistories(res.data.data || []);
    } catch {
      toast.error('خطا در دریافت تاریخچه');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-black text-gray-900 dark:text-white">تاریخچه تغییرات: {productName}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">در حال بارگذاری...</div>
          ) : histories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">هنوز تغییری در این محصول ثبت نشده است.</div>
          ) : (
            <div className="space-y-3">
              {histories.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                  <div className="mt-1">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">تغییر {item.field}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.created_at}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      از <span className="line-through text-error-500 font-mono">{item.old_value}</span>
                      {' '}به{' '}
                      <span className="text-success-600 dark:text-success-400 font-mono font-bold">{item.new_value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
          <Button variant="outline" onClick={onClose}>بستن</Button>
        </div>
      </div>
    </div>
  );
}
