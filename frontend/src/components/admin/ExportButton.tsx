import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  type: 'orders' | 'users' | 'products' | 'chat' | 'reports' | 'summary';
  label?: string;
  filters?: Record<string, any>;
  className?: string;
}

export function ExportButton({ type, label, filters = {}, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      let endpoint = '';
      let filename = '';

      switch (type) {
        case 'orders':
          endpoint = `/admin/export/orders/${format}`;
          filename = `orders.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'users':
          endpoint = `/admin/export/users/${format}`;
          filename = `users.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'products':
          endpoint = `/admin/export/products/${format}`;
          filename = `products.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'chat':
          endpoint = `/admin/export/chat/${format}`;
          filename = `chat.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'reports':
          endpoint = `/admin/export/reports/${format}`;
          filename = `reports.${format === 'excel' ? 'xlsx' : 'pdf'}`;
          break;
        case 'summary':
          endpoint = `/admin/export/summary/pdf`;
          filename = `summary.pdf`;
          break;
      }

      const response = await apiClient.get(endpoint, {
        params: filters,
        responseType: 'blob',
      });

      // ایجاد download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('فایل با موفقیت دانلود شد');
    } catch (error) {
      console.error(error);
      toast.error('خطا در دانلود فایل');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={cn('gap-1.5', className)}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {label || 'Export'}
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            {(type === 'summary' ? (
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
              >
                <FileText className="w-4 h-4 text-red-600" />
                دانلود PDF
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  دانلود Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm border-t border-gray-100"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  دانلود PDF
                </button>
              </>
            ))}
          </div>
        </>
      )}
    </div>
  );
}